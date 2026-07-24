import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

let webhookSequence = 0;

function createWebhookPayload(event: Record<string, unknown>): string {
  webhookSequence += 1;
  return JSON.stringify({
    id: `evt_test_${webhookSequence}`,
    created_at: 1_700_000_000 + webhookSequence,
    ...event,
  });
}

// Mock all external dependencies
const mockDb = {
  transaction: jest.fn(),
};

const mockUsers = {
  id: "users.id",
  paymentProviderCustomerId: "users.paymentProviderCustomerId",
};

const mockCreemWebhookSecret = "test-webhook-secret";

const mockFindUserByCustomerId = jest.fn();
const mockUpsertSubscription = jest.fn();
const mockUpsertPayment = jest.fn();
const mockGrantProductEntitlement = jest.fn();
const mockLockBillingProductScope = jest.fn();
const mockLockPaymentAdjustmentScope = jest.fn();
const mockRecordWebhookEvent = jest.fn();
const mockRevokeProductEntitlementByPaymentId = jest.fn();
const mockSuspendSubscriptionAccess = jest.fn();
const mockUpdatePaymentStatus = jest.fn();

const mockGetProductTierByProductId = jest.fn();
const mockGetProductTierById = jest.fn();

const mockEq = jest.fn();

// Mock crypto module
const mockTimingSafeEqual = jest.fn();
const mockCreateHmacFunction = jest.fn();

jest.mock("@/database", () => ({
  db: mockDb,
}));

jest.mock("@/database/schema", () => ({
  users: mockUsers,
}));

jest.mock("drizzle-orm", () => ({
  eq: mockEq,
}));

jest.mock("./client", () => ({
  creemEnvironment: "live_mode",
  creemWebhookSecret: mockCreemWebhookSecret,
}));

jest.mock("@/lib/database/subscription", () => ({
  findUserByCustomerId: mockFindUserByCustomerId,
  upsertSubscription: mockUpsertSubscription,
  upsertPayment: mockUpsertPayment,
  grantProductEntitlement: mockGrantProductEntitlement,
  lockBillingProductScope: mockLockBillingProductScope,
  lockPaymentAdjustmentScope: mockLockPaymentAdjustmentScope,
  recordWebhookEvent: mockRecordWebhookEvent,
  revokeProductEntitlementByPaymentId: mockRevokeProductEntitlementByPaymentId,
  suspendSubscriptionAccess: mockSuspendSubscriptionAccess,
  updatePaymentStatus: mockUpdatePaymentStatus,
}));

jest.mock("@/lib/config/products", () => ({
  getProductTierById: mockGetProductTierById,
  getProductTierByProductId: mockGetProductTierByProductId,
}));

jest.mock("crypto", () => ({
  createHmac: mockCreateHmacFunction,
  timingSafeEqual: mockTimingSafeEqual,
}));

describe("Creem Webhook Handler", () => {
  const mockUpdate = jest.fn();
  const mockDigest = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    webhookSequence = 0;

    // Suppress console.log, console.warn, console.error in tests
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Setup default mock implementations
    mockCreateHmacFunction.mockReturnValue({
      update: mockUpdate.mockReturnValue({
        digest: mockDigest.mockReturnValue("computed-signature"),
      }),
    });

    mockTimingSafeEqual.mockReturnValue(true);

    mockDb.transaction.mockImplementation(async (callback) => {
      const mockTx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      };
      return callback(mockTx);
    });

    mockRecordWebhookEvent.mockResolvedValue(true);
    mockFindUserByCustomerId.mockResolvedValue({
      id: "user1",
      email: "test@example.com",
    });
    mockUpsertSubscription.mockResolvedValue([]);
    mockUpsertPayment.mockResolvedValue([{ status: "succeeded" }]);
    mockUpdatePaymentStatus.mockResolvedValue([{ id: "payment-row" }]);
    mockLockPaymentAdjustmentScope.mockImplementation(
      async ([paymentReference]: string[]) => paymentReference,
    );
    mockGetProductTierByProductId.mockReturnValue({
      id: "tier_pro",
      name: "Pro Tier",
      pricing: {
        creem: {
          live_mode: { oneTime: "prod_one_time" },
        },
      },
    });
    mockGetProductTierById.mockReturnValue({
      id: "tier_pro",
      name: "Pro Tier",
      pricing: {
        creem: {
          live_mode: { oneTime: "prod_one_time" },
        },
      },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("handleCreemWebhook", () => {
    it("should handle valid webhook with checkout.completed event", async () => {
      const payload = createWebhookPayload({
        id: "evt_checkout_123",
        eventType: "checkout.completed",
        object: {
          id: "checkout_123",
          product: "prod_one_time",
          customer: "cus_123",
          metadata: {
            userId: "user1",
            paymentMode: "subscription",
          },
          order: {
            id: "order_123",
            transaction: "txn_123",
            amount_due: 1000,
            currency: "usd",
          },
          subscription: {
            id: "sub_123",
            product: "prod_123",
            status: "active",
            current_period_start_date: "2024-01-01T00:00:00Z",
            current_period_end_date: "2024-02-01T00:00:00Z",
            canceled_at: null,
          },
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      const result = await handleCreemWebhook(payload, "test-signature");

      expect(result).toEqual({ received: true });
      expect(mockRecordWebhookEvent).toHaveBeenCalledWith(
        "evt_checkout_123",
        "checkout.completed",
        "creem",
        payload,
        expect.any(Object),
      );
      expect(mockUpsertSubscription).toHaveBeenCalled();
      expect(mockUpsertPayment).toHaveBeenCalled();
      expect(mockLockBillingProductScope).toHaveBeenCalledWith(
        "user1",
        "tier_pro",
        expect.any(Object),
      );
      expect(
        mockLockBillingProductScope.mock.invocationCallOrder[0],
      ).toBeLessThan(mockUpsertSubscription.mock.invocationCallOrder[0]!);
    });

    it("rejects webhook objects from another Creem environment", async () => {
      const payload = createWebhookPayload({
        eventType: "payment.succeeded",
        object: {
          id: "payment_123",
          mode: "test",
          customer: "cus_123",
          product_id: "prod_123",
          amount: 1000,
          currency: "usd",
        },
      });

      const { handleCreemWebhook, InvalidWebhookPayloadError } =
        await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow(InvalidWebhookPayloadError);
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it("should handle payment.succeeded event", async () => {
      const payload = createWebhookPayload({
        eventType: "payment.succeeded",
        object: {
          id: "payment_123",
          customer: "cus_123",
          product_id: "prod_123",
          amount: 1000,
          currency: "usd",
          subscription_id: "sub_123",
          metadata: {
            paymentMode: "subscription",
          },
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      const result = await handleCreemWebhook(payload, "test-signature");

      expect(result).toEqual({ received: true });
      expect(mockUpsertPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user1",
          customerId: "cus_123",
          paymentId: "payment_123",
          amount: 1000,
          currency: "usd",
          status: "succeeded",
        }),
        expect.any(Object),
      );
    });

    it("should reject invalid signature", async () => {
      mockTimingSafeEqual.mockReturnValue(false);

      const payload = createWebhookPayload({
        eventType: "checkout.completed",
        object: { id: "checkout_123" },
      });

      const { handleCreemWebhook, CreemWebhookSignatureError } =
        await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "invalid-signature"),
      ).rejects.toThrow(CreemWebhookSignatureError);
    });

    it("should reject malformed JSON after signature verification", async () => {
      const { handleCreemWebhook, InvalidWebhookPayloadError } =
        await import("./webhook");

      await expect(
        handleCreemWebhook("{invalid-json", "test-signature"),
      ).rejects.toThrow(InvalidWebhookPayloadError);
      expect(mockRecordWebhookEvent).not.toHaveBeenCalled();
    });

    it("should reject payloads without a provider event ID", async () => {
      const payload = JSON.stringify({
        created_at: 1_700_000_000,
        eventType: "subscription.update",
        object: { id: "sub_123" },
      });
      const { handleCreemWebhook, InvalidWebhookPayloadError } =
        await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow(InvalidWebhookPayloadError);
      expect(mockRecordWebhookEvent).not.toHaveBeenCalled();
    });

    it("should reject recognized events with invalid object data", async () => {
      const payload = createWebhookPayload({
        eventType: "subscription.update",
        object: { id: "sub_123" },
      });
      const { handleCreemWebhook, InvalidWebhookPayloadError } =
        await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow(InvalidWebhookPayloadError);
      expect(mockRecordWebhookEvent).toHaveBeenCalledTimes(1);
      expect(mockUpsertSubscription).not.toHaveBeenCalled();
    });

    it("should handle duplicate webhook events", async () => {
      mockRecordWebhookEvent.mockResolvedValue(false);

      const payload = createWebhookPayload({
        eventType: "checkout.completed",
        object: { id: "checkout_123" },
      });

      const { handleCreemWebhook } = await import("./webhook");

      const result = await handleCreemWebhook(payload, "test-signature");

      expect(result).toEqual({ received: true });
      expect(mockUpsertSubscription).not.toHaveBeenCalled();
      expect(mockUpsertPayment).not.toHaveBeenCalled();
    });

    it("should process distinct updates for the same subscription object", async () => {
      const createPayload = (eventId: string, status: string) =>
        createWebhookPayload({
          id: eventId,
          eventType: "subscription.update",
          object: {
            id: "sub_123",
            customer: "cus_123",
            product: "prod_123",
            status,
            current_period_start_date: "2024-01-01T00:00:00Z",
            current_period_end_date: "2024-02-01T00:00:00Z",
            canceled_at: null,
          },
        });

      const { handleCreemWebhook } = await import("./webhook");
      await handleCreemWebhook(createPayload("evt_update_1", "active"), "sig");
      await handleCreemWebhook(
        createPayload("evt_update_2", "past_due"),
        "sig",
      );

      expect(mockRecordWebhookEvent).toHaveBeenNthCalledWith(
        1,
        "evt_update_1",
        "subscription.update",
        "creem",
        expect.any(String),
        expect.any(Object),
      );
      expect(mockRecordWebhookEvent).toHaveBeenNthCalledWith(
        2,
        "evt_update_2",
        "subscription.update",
        "creem",
        expect.any(String),
        expect.any(Object),
      );
      expect(mockUpsertSubscription).toHaveBeenCalledTimes(2);
    });

    it("should handle error during signature verification", async () => {
      mockTimingSafeEqual.mockImplementation(() => {
        throw new Error("Buffer length mismatch");
      });

      const payload = createWebhookPayload({
        eventType: "checkout.completed",
        object: { id: "checkout_123" },
      });

      const { handleCreemWebhook } = await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow("Invalid signature.");
    });

    it("should handle millisecond timestamps on subscription.active", async () => {
      const payload = createWebhookPayload({
        created_at: 1_700_000_000_123,
        eventType: "subscription.active",
        object: {
          id: "sub_123",
          customer: "cus_123",
          product: "prod_123",
          status: "active",
          current_period_start_date: "2024-01-01T00:00:00Z",
          current_period_end_date: "2024-02-01T00:00:00Z",
          canceled_at: null,
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      const result = await handleCreemWebhook(payload, "test-signature");

      expect(result).toEqual({ received: true });
      expect(mockUpsertSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user1",
          customerId: "cus_123",
          subscriptionId: "sub_123",
          status: "active",
          lastWebhookCreatedAt: new Date(1_700_000_000_123),
        }),
        expect.any(Object),
      );
      expect(mockLockBillingProductScope).toHaveBeenCalledWith(
        "user1",
        "tier_pro",
        expect.any(Object),
      );
      expect(
        mockLockBillingProductScope.mock.invocationCallOrder[0],
      ).toBeLessThan(mockUpsertSubscription.mock.invocationCallOrder[0]!);
    });

    it("should persist subscription.expired events", async () => {
      const payload = createWebhookPayload({
        eventType: "subscription.expired",
        object: {
          id: "sub_expired",
          customer: "cus_123",
          product: "prod_123",
          status: "expired",
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).resolves.toEqual({ received: true });
      expect(mockUpsertSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: "sub_expired",
          status: "expired",
        }),
        expect.any(Object),
      );
    });

    it("should handle subscription renewal with payment object", async () => {
      const payload = createWebhookPayload({
        eventType: "payment.succeeded",
        object: {
          id: "payment_123",
          customer: "cus_123",
          subscription_id: "sub_123",
          product_id: "prod_123",
          amount: 1000,
          currency: "usd",
          billing_reason: "subscription_cycle",
          lines: {
            data: [
              {
                period: {
                  start: Math.floor(new Date("2024-01-01").getTime() / 1000),
                  end: Math.floor(new Date("2024-02-01").getTime() / 1000),
                },
                price: {
                  product: "prod_123",
                },
              },
            ],
          },
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      const result = await handleCreemWebhook(payload, "test-signature");

      expect(result).toEqual({ received: true });
      expect(mockUpsertSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "active",
          currentPeriodStart: expect.any(Date),
          currentPeriodEnd: expect.any(Date),
        }),
        expect.any(Object),
      );
    });

    it("should reject invalid renewal period timestamps", async () => {
      const payload = createWebhookPayload({
        eventType: "payment.succeeded",
        object: {
          id: "payment_123",
          customer: "cus_123",
          subscription_id: "sub_123",
          product_id: "prod_123",
          amount: 1000,
          currency: "usd",
          billing_reason: "subscription_cycle",
          lines: {
            data: [
              {
                period: {
                  start: "invalid",
                  end: "invalid",
                },
              },
            ],
          },
        },
      });
      const { handleCreemWebhook, InvalidWebhookPayloadError } =
        await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow(InvalidWebhookPayloadError);
      expect(mockUpsertSubscription).not.toHaveBeenCalled();
    });

    it("should handle one_time payment in checkout.completed", async () => {
      const payload = createWebhookPayload({
        eventType: "checkout.completed",
        object: {
          id: "checkout_123",
          product: "prod_one_time",
          customer: "cus_123",
          metadata: {
            userId: "user1",
            paymentMode: "one_time",
            tierId: "tier_pro",
          },
          order: {
            id: "order_123",
            transaction: "txn_123",
            amount_due: 1000,
            currency: "usd",
          },
          subscription: null,
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      const result = await handleCreemWebhook(payload, "test-signature");

      expect(result).toEqual({ received: true });
      expect(mockUpsertPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: null,
          paymentType: "one_time",
        }),
        expect.any(Object),
      );
      expect(mockGrantProductEntitlement).toHaveBeenCalledWith(
        {
          userId: "user1",
          productId: "tier_pro",
          sourcePaymentId: "txn_123",
        },
        expect.any(Object),
      );
      expect(mockLockBillingProductScope).toHaveBeenCalledWith(
        "user1",
        "tier_pro",
        expect.any(Object),
      );
      expect(
        mockLockBillingProductScope.mock.invocationCallOrder[0],
      ).toBeLessThan(mockUpsertPayment.mock.invocationCallOrder[0]!);
      expect(mockUpsertSubscription).not.toHaveBeenCalled();
    });

    it("accepts the documented checkout order shape without a transaction", async () => {
      const payload = createWebhookPayload({
        eventType: "checkout.completed",
        object: {
          id: "ch_7Whn2iLUXNdlN1aaP8h5t3",
          product: {
            id: "prod_6tW66i0oZM7Uao6h7G0SGN",
          },
          customer: {
            id: "cust_QwkD7pVtbG8Q5h5Y5fP1l",
          },
          metadata: {
            userId: "user1",
            paymentMode: "one_time",
            tierId: "tier_pro",
          },
          order: {
            id: "ord_4PXekRpPPDfdAsW4rMPm7R",
            amount: 1000,
            currency: "EUR",
          },
          subscription: null,
        },
      });
      mockGetProductTierById.mockReturnValue({
        id: "tier_pro",
        pricing: {
          creem: {
            live_mode: {
              oneTime: "prod_6tW66i0oZM7Uao6h7G0SGN",
            },
          },
        },
      });
      const { handleCreemWebhook } = await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).resolves.toEqual({ received: true });
      expect(mockUpsertPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: "ord_4PXekRpPPDfdAsW4rMPm7R",
          amount: 1000,
          currency: "EUR",
        }),
        expect.any(Object),
      );
      expect(mockGrantProductEntitlement).toHaveBeenCalledWith(
        expect.objectContaining({
          sourcePaymentId: "ord_4PXekRpPPDfdAsW4rMPm7R",
        }),
        expect.any(Object),
      );
    });

    it("rejects one-time entitlement when checkout product mismatches metadata", async () => {
      const payload = createWebhookPayload({
        eventType: "checkout.completed",
        object: {
          id: "checkout_123",
          product: "prod_wrong",
          customer: "cus_123",
          metadata: {
            userId: "user1",
            paymentMode: "one_time",
            tierId: "tier_pro",
          },
          order: {
            id: "order_123",
            transaction: "txn_123",
            amount_due: 1000,
            currency: "usd",
          },
        },
      });
      const { handleCreemWebhook, InvalidWebhookPayloadError } =
        await import("./webhook");

      await expect(handleCreemWebhook(payload, "signature")).rejects.toThrow(
        InvalidWebhookPayloadError,
      );
      expect(mockUpsertPayment).not.toHaveBeenCalled();
      expect(mockGrantProductEntitlement).not.toHaveBeenCalled();
    });

    it("revokes lifetime access after a succeeded full refund", async () => {
      const payload = createWebhookPayload({
        eventType: "refund.created",
        object: {
          id: "refund_123",
          status: "succeeded",
          refund_amount: 1210,
          transaction: {
            id: "txn_123",
            amount: 1000,
            amount_paid: 1210,
            refunded_amount: 1210,
            status: "refunded",
          },
        },
      });
      const { handleCreemWebhook } = await import("./webhook");

      await handleCreemWebhook(payload, "signature");

      expect(mockUpdatePaymentStatus).toHaveBeenCalledWith(
        "txn_123",
        "refunded",
        expect.any(Object),
      );
      expect(mockRevokeProductEntitlementByPaymentId).toHaveBeenCalledWith(
        "txn_123",
        "refunded",
        expect.any(Object),
      );
    });

    it("falls back to the order reference for refund adjustments", async () => {
      mockLockPaymentAdjustmentScope.mockResolvedValueOnce("order_123");
      const payload = createWebhookPayload({
        eventType: "refund.created",
        object: {
          id: "refund_123",
          status: "succeeded",
          refund_amount: 1000,
          transaction: {
            id: "txn_123",
            order: "order_123",
            amount: 1000,
            refunded_amount: 1000,
            status: "refunded",
          },
        },
      });
      const { handleCreemWebhook } = await import("./webhook");

      await handleCreemWebhook(payload, "signature");

      expect(mockLockPaymentAdjustmentScope).toHaveBeenCalledWith(
        ["txn_123", "order_123"],
        expect.any(Object),
      );
      expect(mockUpdatePaymentStatus).toHaveBeenCalledWith(
        "order_123",
        "refunded",
        expect.any(Object),
      );
      expect(mockRevokeProductEntitlementByPaymentId).toHaveBeenCalledWith(
        "order_123",
        "refunded",
        expect.any(Object),
      );
    });

    it("records a partial refund without revoking lifetime access", async () => {
      const payload = createWebhookPayload({
        eventType: "refund.created",
        object: {
          id: "refund_123",
          status: "succeeded",
          refund_amount: 1000,
          transaction: {
            id: "txn_123",
            amount: 1000,
            amount_paid: 1210,
            status: "partialRefund",
          },
        },
      });
      const { handleCreemWebhook } = await import("./webhook");

      await handleCreemWebhook(payload, "signature");

      expect(mockUpdatePaymentStatus).toHaveBeenCalledWith(
        "txn_123",
        "partially_refunded",
        expect.any(Object),
      );
      expect(mockRevokeProductEntitlementByPaymentId).not.toHaveBeenCalled();
    });

    it("suspends subscription access after a full refund", async () => {
      mockUpdatePaymentStatus.mockResolvedValue([
        { subscriptionId: "subscription_123" },
      ]);
      const payload = createWebhookPayload({
        eventType: "refund.created",
        object: {
          id: "refund_subscription",
          status: "succeeded",
          refund_amount: 1210,
          transaction: {
            id: "txn_subscription",
            amount: 1000,
            amount_paid: 1210,
            refunded_amount: 1210,
            status: "refunded",
          },
        },
      });
      const { handleCreemWebhook } = await import("./webhook");

      await handleCreemWebhook(payload, "signature");

      expect(mockSuspendSubscriptionAccess).toHaveBeenCalledWith(
        "subscription_123",
        expect.any(Date),
        expect.any(Object),
      );
    });

    it("revokes lifetime access when a dispute is created", async () => {
      mockUpdatePaymentStatus.mockResolvedValue([
        { subscriptionId: "subscription_123" },
      ]);
      const payload = createWebhookPayload({
        eventType: "dispute.created",
        object: {
          id: "dispute_123",
          amount: 1000,
          transaction: {
            id: "txn_123",
            amount: 1000,
            status: "chargedBack",
          },
        },
      });
      const { handleCreemWebhook } = await import("./webhook");

      await handleCreemWebhook(payload, "signature");

      expect(mockUpdatePaymentStatus).toHaveBeenCalledWith(
        "txn_123",
        "disputed",
        expect.any(Object),
      );
      expect(mockRevokeProductEntitlementByPaymentId).toHaveBeenCalledWith(
        "txn_123",
        "disputed",
        expect.any(Object),
      );
      expect(mockSuspendSubscriptionAccess).toHaveBeenCalledWith(
        "subscription_123",
        expect.any(Date),
        expect.any(Object),
      );
    });

    it("retries an adjustment that arrives before its payment", async () => {
      mockLockPaymentAdjustmentScope.mockRejectedValue(
        new Error("Payment txn_123 is not available yet"),
      );
      const payload = createWebhookPayload({
        eventType: "dispute.created",
        object: {
          id: "dispute_early",
          amount: 1000,
          transaction: {
            id: "txn_123",
            amount: 1000,
            status: "chargedBack",
          },
        },
      });
      const { handleCreemWebhook } = await import("./webhook");

      await expect(handleCreemWebhook(payload, "signature")).rejects.toThrow(
        "not available yet",
      );
      expect(mockUpdatePaymentStatus).not.toHaveBeenCalled();
      expect(mockRevokeProductEntitlementByPaymentId).not.toHaveBeenCalled();
    });

    it("does not restore lifetime access from a delayed checkout event", async () => {
      mockUpsertPayment.mockResolvedValue([{ status: "refunded" }]);
      const payload = createWebhookPayload({
        eventType: "checkout.completed",
        object: {
          id: "checkout_late",
          product: "prod_one_time",
          customer: "cus_123",
          metadata: {
            userId: "user1",
            paymentMode: "one_time",
            tierId: "tier_pro",
          },
          order: {
            id: "order_late",
            transaction: "txn_refunded",
            amount_due: 1210,
            currency: "usd",
          },
        },
      });
      const { handleCreemWebhook } = await import("./webhook");

      await handleCreemWebhook(payload, "signature");

      expect(mockGrantProductEntitlement).not.toHaveBeenCalled();
    });

    it("should skip already processed events", async () => {
      mockRecordWebhookEvent.mockResolvedValue(false);

      const payload = createWebhookPayload({
        eventType: "checkout.completed",
        object: {
          id: "checkout_123",
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      const result = await handleCreemWebhook(payload, "test-signature");

      expect(result).toEqual({ received: true });
      expect(mockUpsertSubscription).not.toHaveBeenCalled();
      expect(mockUpsertPayment).not.toHaveBeenCalled();
    });

    it("should ignore unhandled event types", async () => {
      const payload = createWebhookPayload({
        eventType: "unhandled.event",
        object: {
          id: "obj_123",
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      const result = await handleCreemWebhook(payload, "test-signature");

      expect(result).toEqual({ received: true });
      expect(mockUpsertSubscription).not.toHaveBeenCalled();
      expect(mockUpsertPayment).not.toHaveBeenCalled();
    });

    it("should throw error for invalid signature", async () => {
      mockTimingSafeEqual.mockReturnValue(false);

      const payload = createWebhookPayload({
        eventType: "checkout.completed",
        object: { id: "checkout_123" },
      });

      const { handleCreemWebhook, CreemWebhookSignatureError } =
        await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "invalid-signature"),
      ).rejects.toThrow(CreemWebhookSignatureError);
    });

    it("should handle signature comparison errors gracefully", async () => {
      mockTimingSafeEqual.mockImplementation(() => {
        throw new Error("Buffer length mismatch");
      });

      const payload = createWebhookPayload({
        eventType: "checkout.completed",
        object: { id: "checkout_123" },
      });

      const { handleCreemWebhook, CreemWebhookSignatureError } =
        await import("./webhook");

      await expect(handleCreemWebhook(payload, "signature")).rejects.toThrow(
        CreemWebhookSignatureError,
      );
    });

    it("should handle missing customer field in checkout", async () => {
      const payload = createWebhookPayload({
        eventType: "checkout.completed",
        object: {
          id: "checkout_123",
          customer: undefined,
          metadata: {
            userId: "user1",
            paymentMode: "subscription",
          },
          order: {
            id: "order_123",
            transaction: "txn_123",
            amount_due: 1000,
            currency: "usd",
          },
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow(
        "checkout.completed event is missing required data objects",
      );
    });

    it("should handle missing userId in metadata", async () => {
      const payload = createWebhookPayload({
        eventType: "checkout.completed",
        object: {
          id: "checkout_123",
          customer: "cus_123",
          metadata: {
            paymentMode: "subscription",
          },
          order: {
            id: "order_123",
            transaction: "txn_123",
            amount_due: 1000,
            currency: "usd",
          },
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow(
        "userId not found in metadata for checkout checkout_123",
      );
    });

    it("should handle customer as object instead of string", async () => {
      const payload = createWebhookPayload({
        eventType: "subscription.active",
        object: {
          id: "sub_123",
          customer: { id: "cus_123" },
          product: "prod_123",
          status: "active",
          current_period_start_date: "2024-01-01T00:00:00Z",
          current_period_end_date: "2024-02-01T00:00:00Z",
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      const result = await handleCreemWebhook(payload, "test-signature");

      expect(result).toEqual({ received: true });
      expect(mockFindUserByCustomerId).toHaveBeenCalledWith(
        "cus_123",
        expect.any(Object),
      );
    });

    it("should handle product as object in subscription events", async () => {
      const payload = createWebhookPayload({
        eventType: "subscription.active",
        object: {
          id: "sub_123",
          customer: "cus_123",
          product: { id: "prod_123" },
          status: "active",
          current_period_start_date: "2024-01-01T00:00:00Z",
          current_period_end_date: "2024-02-01T00:00:00Z",
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      const result = await handleCreemWebhook(payload, "test-signature");

      expect(result).toEqual({ received: true });
      expect(mockGetProductTierByProductId).toHaveBeenCalledWith(
        "prod_123",
        "live_mode",
      );
    });

    it("should handle user not found error in subscription events", async () => {
      mockFindUserByCustomerId.mockResolvedValue(null);

      const payload = createWebhookPayload({
        eventType: "subscription.active",
        object: {
          id: "sub_123",
          customer: "cus_nonexistent",
          product: "prod_123",
          status: "active",
          current_period_start_date: "2024-01-01T00:00:00Z",
          current_period_end_date: "2024-02-01T00:00:00Z",
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow(
        "User not found for customerId cus_nonexistent on subscription event.",
      );
    });

    it("should handle missing subscription ID in renewal event", async () => {
      // This event should trigger subscription ID missing error
      // Create a payment object that will be identified as payment object but missing both subscription_id and id
      const payload = createWebhookPayload({
        eventType: "subscription.paid",
        object: {
          id: "", // Empty ID so that renewalData.id is falsy
          customer: "cus_123",
          amount: 1000,
          subscription_id: null, // Explicitly null so subscription_id check fails
          // This will be identified as payment object due to having 'amount' field
          // but will fail at subscription ID check because both subscription_id and id are falsy
        },
      });

      const { handleCreemWebhook, InvalidWebhookPayloadError } =
        await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow(InvalidWebhookPayloadError);
    });

    it("should handle missing product ID in payment event", async () => {
      const payload = createWebhookPayload({
        eventType: "payment.succeeded",
        object: {
          id: "payment_123",
          customer: "cus_123",
          // Missing product_id and lines
          amount: 1000,
          currency: "usd",
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow("Product ID missing in payment event");
    });

    it("should handle unsupported payment mode in checkout", async () => {
      const payload = createWebhookPayload({
        eventType: "checkout.completed",
        object: {
          id: "checkout_123",
          product: "prod_one_time",
          customer: "cus_123",
          metadata: {
            userId: "user1",
            paymentMode: "unsupported_mode",
          },
          order: {
            id: "order_123",
            transaction: "txn_123",
            amount_due: 1000,
            currency: "usd",
          },
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow("Unsupported payment mode: unsupported_mode");
    });

    it("should handle subscription.paid event with subscription object", async () => {
      const payload = createWebhookPayload({
        eventType: "subscription.paid",
        object: {
          id: "sub_123",
          customer: "cus_123",
          product: "prod_123",
          status: "active",
          current_period_start_date: "2024-01-01T00:00:00Z",
          current_period_end_date: "2024-02-01T00:00:00Z",
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      const result = await handleCreemWebhook(payload, "test-signature");

      expect(result).toEqual({ received: true });
      expect(mockUpsertSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: "sub_123",
          status: "active",
        }),
        expect.any(Object),
      );
    });

    it("should reject payment events without a numeric amount", async () => {
      const payload = createWebhookPayload({
        eventType: "payment.succeeded",
        object: {
          id: "payment_123",
          customer: "cus_123",
          product_id: "prod_123",
          amount: null,
          subscription_id: "sub_123",
        },
      });

      const { handleCreemWebhook, InvalidWebhookPayloadError } =
        await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow(InvalidWebhookPayloadError);
      expect(mockUpsertPayment).not.toHaveBeenCalled();
    });
  });

  describe("Type guards", () => {
    it("should correctly identify checkout objects", async () => {
      const checkoutPayload = createWebhookPayload({
        eventType: "checkout.completed",
        object: {
          id: "checkout_123",
          product: "prod_one_time",
          customer: "cus_123",
          metadata: {
            userId: "user1",
            paymentMode: "one_time",
            tierId: "tier_pro",
          },
          order: {
            id: "order_123",
            transaction: "txn_123",
            amount_due: 1000,
            currency: "usd",
          },
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      const result = await handleCreemWebhook(
        checkoutPayload,
        "test-signature",
      );
      expect(result).toEqual({ received: true });
    });

    it("should correctly identify subscription objects", async () => {
      const subscriptionPayload = createWebhookPayload({
        eventType: "subscription.active",
        object: {
          id: "sub_123",
          customer: "cus_123",
          product: "prod_123",
          status: "active",
          current_period_start_date: "2024-01-01T00:00:00Z",
          current_period_end_date: "2024-02-01T00:00:00Z",
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      const result = await handleCreemWebhook(
        subscriptionPayload,
        "test-signature",
      );
      expect(result).toEqual({ received: true });
    });

    it("should correctly identify payment objects", async () => {
      const paymentPayload = createWebhookPayload({
        eventType: "payment.succeeded",
        object: {
          id: "payment_123",
          customer: "cus_123",
          product_id: "prod_123",
          amount: 1000,
          currency: "usd",
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      const result = await handleCreemWebhook(paymentPayload, "test-signature");
      expect(result).toEqual({ received: true });
    });
  });

  describe("Error Handling Edge Cases", () => {
    beforeEach(() => {
      // Reset all mocks
      jest.clearAllMocks();

      // Suppress console.log, console.warn, console.error in tests
      jest.spyOn(console, "log").mockImplementation(() => {});
      jest.spyOn(console, "warn").mockImplementation(() => {});
      jest.spyOn(console, "error").mockImplementation(() => {});

      // Set up transaction mock with proper mockTx
      mockDb.transaction.mockImplementation(async (callback) => {
        const mockTx = {
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          }),
        };
        return callback(mockTx);
      });

      mockFindUserByCustomerId.mockResolvedValue({
        id: "user-123",
        paymentProviderCustomerId: "cus_123",
      });
      mockRecordWebhookEvent.mockResolvedValue(true);
      mockGetProductTierByProductId.mockResolvedValue("pro");
      mockTimingSafeEqual.mockReturnValue(true);
      mockCreateHmacFunction.mockReturnValue({
        update: jest.fn().mockReturnValue({
          digest: jest.fn().mockReturnValue("test-signature"),
        }),
      });

      // Ensure webhook secret is set
      jest.doMock("./client", () => ({
        creemEnvironment: "live_mode",
        creemWebhookSecret: "test-webhook-secret",
      }));
    });

    it("should handle missing customer field error", async () => {
      const payload = createWebhookPayload({
        eventType: "payment.succeeded",
        object: {
          id: "payment_123",
          customer: null, // This will trigger getCustomerId error
          product_id: "prod_123",
          amount: 1000,
        },
      });

      const { handleCreemWebhook, InvalidWebhookPayloadError } =
        await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow(InvalidWebhookPayloadError);
    });

    it("should handle user not found error in subscription renewal", async () => {
      // Test that specifically covers line 293 in webhook.ts
      mockFindUserByCustomerId.mockResolvedValue(null);

      const payload = createWebhookPayload({
        eventType: "subscription.paid",
        object: {
          id: "payment_123",
          customer: "cus_nonexistent",
          subscription_id: "sub_123",
          amount: 1000,
          lines: {
            data: [
              {
                period: {
                  start: 1640995200, // 2022-01-01
                  end: 1643673600, // 2022-02-01
                },
                price: {
                  product: "prod_123",
                },
              },
            ],
          },
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow(
        "User not found for customerId cus_nonexistent during subscription renewal.",
      );
    });

    it("should handle user not found error in payment processing", async () => {
      mockFindUserByCustomerId.mockResolvedValue(null);

      const payload = createWebhookPayload({
        eventType: "payment.succeeded",
        object: {
          id: "payment_123",
          customer: "cus_nonexistent",
          product_id: "prod_123",
          amount: 1000,
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow(
        "User not found for customerId cus_nonexistent during payment processing.",
      );
    });

    it("should handle period determination error in subscription renewal", async () => {
      const payload = createWebhookPayload({
        eventType: "subscription.paid",
        object: {
          id: "payment_123",
          customer: "cus_123",
          subscription_id: "sub_123",
          amount: 1000,
          // Missing both lines.data[0].period and the required subscription period fields
          // This will trigger the "Could not determine new period" error
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow(
        "Could not determine new period for subscription renewal from event object.",
      );
    });

    it("should handle missing customer field with undefined value", async () => {
      const payload = createWebhookPayload({
        eventType: "payment.succeeded",
        object: {
          id: "payment_123",
          customer: undefined, // Explicitly undefined
          product_id: "prod_123",
          amount: 1000,
        },
      });

      const { handleCreemWebhook, InvalidWebhookPayloadError } =
        await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow(InvalidWebhookPayloadError);
    });

    it("should handle object customer field as object", async () => {
      const payload = createWebhookPayload({
        eventType: "payment.succeeded",
        object: {
          id: "payment_123",
          customer: { id: "cus_123" }, // Customer as object rather than string
          product_id: "prod_123",
          amount: 1000,
        },
      });

      const { handleCreemWebhook } = await import("./webhook");

      const result = await handleCreemWebhook(payload, "test-signature");
      expect(result).toEqual({ received: true });
      expect(mockFindUserByCustomerId).toHaveBeenCalledWith(
        "cus_123",
        expect.any(Object),
      );
    });

    it("should handle missing customer field with empty object", async () => {
      const payload = createWebhookPayload({
        eventType: "payment.succeeded",
        object: {
          id: "payment_123",
          customer: {}, // Empty object without id - customerField.id will be undefined
          product_id: "prod_123",
          amount: 1000,
        },
      });

      const { handleCreemWebhook, InvalidWebhookPayloadError } =
        await import("./webhook");

      await expect(
        handleCreemWebhook(payload, "test-signature"),
      ).rejects.toThrow(InvalidWebhookPayloadError);
      expect(mockFindUserByCustomerId).not.toHaveBeenCalled();
    });
  });
});
