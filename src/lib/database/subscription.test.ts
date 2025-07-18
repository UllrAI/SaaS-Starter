import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Mock all external dependencies
const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
};

const mockSubscriptions = {
  subscriptionId: "subscriptions.subscriptionId",
  userId: "subscriptions.userId",
  customerId: "subscriptions.customerId",
  productId: "subscriptions.productId",
  status: "subscriptions.status",
  currentPeriodStart: "subscriptions.currentPeriodStart",
  currentPeriodEnd: "subscriptions.currentPeriodEnd",
  canceledAt: "subscriptions.canceledAt",
  createdAt: "subscriptions.createdAt",
  updatedAt: "subscriptions.updatedAt",
};

const mockPayments = {
  paymentId: "payments.paymentId",
  userId: "payments.userId",
  customerId: "payments.customerId",
  productId: "payments.productId",
  amount: "payments.amount",
  currency: "payments.currency",
  status: "payments.status",
  paymentType: "payments.paymentType",
  createdAt: "payments.createdAt",
  updatedAt: "payments.updatedAt",
};

const mockUsers = {
  id: "users.id",
  paymentProviderCustomerId: "users.paymentProviderCustomerId",
};

const mockWebhookEvents = {
  eventId: "webhookEvents.eventId",
  eventType: "webhookEvents.eventType",
  provider: "webhookEvents.provider",
  payload: "webhookEvents.payload",
  processed: "webhookEvents.processed",
  processedAt: "webhookEvents.processedAt",
};

const mockEq = jest.fn();
const mockDesc = jest.fn();
const mockAnd = jest.fn();

const mockGetProductTierByProductId = jest.fn();
const mockGetProductTierById = jest.fn();

// Mock all imports
jest.mock("@/database", () => ({
  db: mockDb,
}));

jest.mock("@/database/tables", () => ({
  subscriptions: mockSubscriptions,
  payments: mockPayments,
  users: mockUsers,
  webhookEvents: mockWebhookEvents,
}));

jest.mock("drizzle-orm", () => ({
  eq: mockEq,
  desc: mockDesc,
  and: mockAnd,
}));

jest.mock("@/lib/config/products", () => ({
  getProductTierByProductId: mockGetProductTierByProductId,
  getProductTierById: mockGetProductTierById,
}));

describe("Database Subscription Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
        limit: jest.fn().mockResolvedValue([]),
      }),
    });

    mockDb.insert.mockReturnValue({
      values: jest.fn().mockReturnValue({
        onConflictDoUpdate: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
        onConflictDoNothing: jest.fn().mockResolvedValue([]),
        returning: jest.fn().mockResolvedValue([]),
      }),
    });

    mockGetProductTierByProductId.mockReturnValue({
      id: "tier_pro",
      name: "Pro Plan",
    });

    mockGetProductTierById.mockReturnValue({
      id: "tier_basic",
      name: "Basic Plan",
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("upsertSubscription", () => {
    it("should create a new subscription", async () => {
      const subscriptionData = {
        userId: "user-123",
        customerId: "customer-123",
        subscriptionId: "sub-123",
        productId: "product-123",
        status: "active" as const,
        currentPeriodStart: new Date("2024-01-01"),
        currentPeriodEnd: new Date("2024-02-01"),
        canceledAt: null,
      };

      const mockResult = [{ id: "subscription-id", ...subscriptionData }];

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue(mockResult),
          }),
        }),
      });

      const { upsertSubscription } = await import("./subscription");

      const result = await upsertSubscription(subscriptionData);

      expect(result).toEqual(mockResult);
      expect(mockDb.insert).toHaveBeenCalledWith(mockSubscriptions);
    });

    it("should update existing subscription on conflict", async () => {
      const subscriptionData = {
        userId: "user-123",
        customerId: "customer-123",
        subscriptionId: "sub-123",
        productId: "product-123",
        status: "canceled" as const,
        currentPeriodStart: new Date("2024-01-01"),
        currentPeriodEnd: new Date("2024-02-01"),
        canceledAt: new Date("2024-01-15"),
      };

      const mockUpdateResult = [{ id: "subscription-id", ...subscriptionData }];

      const mockOnConflictDoUpdate = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue(mockUpdateResult),
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: mockOnConflictDoUpdate,
        }),
      });

      const { upsertSubscription } = await import("./subscription");

      const result = await upsertSubscription(subscriptionData);

      expect(result).toEqual(mockUpdateResult);
      expect(mockOnConflictDoUpdate).toHaveBeenCalledWith({
        target: mockSubscriptions.subscriptionId,
        set: expect.objectContaining({
          status: "canceled",
          productId: "product-123",
          canceledAt: subscriptionData.canceledAt,
          updatedAt: expect.any(Date),
        }),
      });
    });

    it("should work with transaction", async () => {
      const subscriptionData = {
        userId: "user-123",
        customerId: "customer-123",
        subscriptionId: "sub-123",
        productId: "product-123",
        status: "active" as const,
      };

      const mockTx = {
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({
            onConflictDoUpdate: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      const { upsertSubscription } = await import("./subscription");

      await upsertSubscription(subscriptionData, mockTx as any);

      expect(mockTx.insert).toHaveBeenCalledWith(mockSubscriptions);
    });
  });

  describe("upsertPayment", () => {
    it("should create a new payment", async () => {
      const paymentData = {
        userId: "user-123",
        customerId: "customer-123",
        subscriptionId: "sub-123",
        productId: "product-123",
        paymentId: "payment-123",
        amount: 1000,
        currency: "usd",
        status: "succeeded",
        paymentType: "subscription",
      };

      const mockResult = [{ id: "payment-id", ...paymentData }];

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue(mockResult),
          }),
        }),
      });

      const { upsertPayment } = await import("./subscription");

      const result = await upsertPayment(paymentData);

      expect(result).toEqual(mockResult);
      expect(mockDb.insert).toHaveBeenCalledWith(mockPayments);
    });

    it("should update existing payment on conflict", async () => {
      const paymentData = {
        userId: "user-123",
        customerId: "customer-123",
        paymentId: "payment-123",
        productId: "product-123",
        amount: 1000,
        currency: "usd",
        status: "failed",
        paymentType: "subscription",
      };

      const mockOnConflictDoUpdate = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([]),
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: mockOnConflictDoUpdate,
        }),
      });

      const { upsertPayment } = await import("./subscription");

      await upsertPayment(paymentData);

      expect(mockOnConflictDoUpdate).toHaveBeenCalledWith({
        target: mockPayments.paymentId,
        set: expect.objectContaining({
          status: "failed",
          updatedAt: expect.any(Date),
        }),
      });
    });

    it("should handle nullable subscriptionId", async () => {
      const paymentData = {
        userId: "user-123",
        customerId: "customer-123",
        subscriptionId: null,
        productId: "product-123",
        paymentId: "payment-123",
        amount: 1000,
        currency: "usd",
        status: "succeeded",
        paymentType: "one_time",
      };

      const { upsertPayment } = await import("./subscription");

      await upsertPayment(paymentData);

      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("findUserByCustomerId", () => {
    it("should find user by customer ID", async () => {
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        paymentProviderCustomerId: "customer-123",
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const { findUserByCustomerId } = await import("./subscription");

      const result = await findUserByCustomerId("customer-123");

      expect(result).toEqual(mockUser);
      expect(mockEq).toHaveBeenCalledWith(
        mockUsers.paymentProviderCustomerId,
        "customer-123",
      );
    });

    it("should return null when user not found", async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const { findUserByCustomerId } = await import("./subscription");

      const result = await findUserByCustomerId("nonexistent-customer");

      expect(result).toBeNull();
    });

    it("should work with transaction", async () => {
      const mockTx = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      const { findUserByCustomerId } = await import("./subscription");

      await findUserByCustomerId("customer-123", mockTx as any);

      expect(mockTx.select).toHaveBeenCalled();
    });
  });

  describe("getUserSubscription", () => {
    it("should return null when no subscriptions found", async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const { getUserSubscription } = await import("./subscription");

      const result = await getUserSubscription("user-123");

      expect(result).toBeNull();
    });

    it("should return active subscription when available", async () => {
      const mockSubscription = {
        id: "sub-db-id",
        userId: "user-123",
        customerId: "customer-123",
        subscriptionId: "sub-123",
        productId: "product-123",
        status: "active",
        currentPeriodStart: new Date("2024-01-01"),
        currentPeriodEnd: new Date("2024-02-01"),
        canceledAt: null,
        createdAt: new Date("2024-01-01"),
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockSubscription]),
          }),
        }),
      });

      const { getUserSubscription } = await import("./subscription");

      const result = await getUserSubscription("user-123");

      expect(result).toEqual({
        id: "sub-db-id",
        userId: "user-123",
        customerId: "customer-123",
        subscriptionId: "sub-123",
        status: "active",
        tierId: "tier_pro",
        currentPeriodStart: mockSubscription.currentPeriodStart,
        currentPeriodEnd: mockSubscription.currentPeriodEnd,
        canceledAt: null,
      });

      expect(mockGetProductTierByProductId).toHaveBeenCalledWith("product-123");
    });

    it("should prefer active subscription over canceled ones", async () => {
      const mockSubscriptions = [
        {
          id: "sub-canceled",
          userId: "user-123",
          subscriptionId: "sub-canceled",
          productId: "product-123",
          status: "canceled",
          createdAt: new Date("2024-01-02"),
        },
        {
          id: "sub-active",
          userId: "user-123",
          subscriptionId: "sub-active",
          productId: "product-123",
          status: "active",
          createdAt: new Date("2024-01-01"),
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockSubscriptions),
          }),
        }),
      });

      const { getUserSubscription } = await import("./subscription");

      const result = await getUserSubscription("user-123");

      expect(result?.subscriptionId).toBe("sub-active");
    });

    it("should handle trialing subscriptions", async () => {
      const mockSubscription = {
        id: "sub-trial",
        userId: "user-123",
        subscriptionId: "sub-trial",
        productId: "product-123",
        status: "trialing",
        createdAt: new Date("2024-01-01"),
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockSubscription]),
          }),
        }),
      });

      const { getUserSubscription } = await import("./subscription");

      const result = await getUserSubscription("user-123");

      expect(result?.status).toBe("trialing");
    });

    it("should log warning for multiple active subscriptions", async () => {
      const mockSubscriptions = [
        {
          id: "sub1",
          userId: "user-123",
          subscriptionId: "sub-123-1",
          productId: "product-123",
          status: "active",
          createdAt: new Date("2024-01-02"),
        },
        {
          id: "sub2",
          userId: "user-123",
          subscriptionId: "sub-123-2",
          productId: "product-123",
          status: "active",
          createdAt: new Date("2024-01-01"),
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockSubscriptions),
          }),
        }),
      });

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const { getUserSubscription } = await import("./subscription");

      const result = await getUserSubscription("user-123");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "User user-123 has 2 active/trialing subscriptions",
        ),
        expect.objectContaining({
          userId: "user-123",
          subscriptionIds: ["sub-123-1", "sub-123-2"],
          statuses: ["active", "active"],
        }),
      );

      // Should return the most recent active subscription
      expect(result?.subscriptionId).toBe("sub-123-1");

      consoleSpy.mockRestore();
    });

    it("should fallback to product ID when tier not found", async () => {
      const mockSubscription = {
        id: "sub-id",
        userId: "user-123",
        subscriptionId: "sub-123",
        productId: "unknown-product",
        status: "active",
        createdAt: new Date("2024-01-01"),
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockSubscription]),
          }),
        }),
      });

      mockGetProductTierByProductId.mockReturnValue(null);

      const { getUserSubscription } = await import("./subscription");

      const result = await getUserSubscription("user-123");

      expect(result?.tierId).toBe("unknown-product");
    });

    it("should handle edge case with empty subscriptions array after sorting", async () => {
      // Test the line "if (!subToReturn) return null;" at line 139
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]), // Empty array
          }),
        }),
      });

      const { getUserSubscription } = await import("./subscription");

      const result = await getUserSubscription("user-123");

      expect(result).toBeNull();
    });

    it("should return most recent subscription when no active/trialing ones exist", async () => {
      const mockSubscriptions = [
        {
          id: "sub-canceled-recent",
          userId: "user-123",
          subscriptionId: "sub-canceled-recent",
          productId: "product-123",
          status: "canceled",
          createdAt: new Date("2024-01-02"),
        },
        {
          id: "sub-expired-old",
          userId: "user-123",
          subscriptionId: "sub-expired-old",
          productId: "product-123",
          status: "expired",
          createdAt: new Date("2024-01-01"),
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockSubscriptions),
          }),
        }),
      });

      const { getUserSubscription } = await import("./subscription");

      const result = await getUserSubscription("user-123");

      // Should return the most recent subscription even if not active
      expect(result?.subscriptionId).toBe("sub-canceled-recent");
      expect(result?.status).toBe("canceled");
    });

    it("should handle mixed trialing and active subscriptions", async () => {
      const mockSubscriptions = [
        {
          id: "sub-trialing",
          userId: "user-123",
          subscriptionId: "sub-trialing",
          productId: "product-123",
          status: "trialing",
          createdAt: new Date("2024-01-03"),
        },
        {
          id: "sub-active",
          userId: "user-123",
          subscriptionId: "sub-active",
          productId: "product-123",
          status: "active",
          createdAt: new Date("2024-01-02"),
        },
        {
          id: "sub-canceled",
          userId: "user-123",
          subscriptionId: "sub-canceled",
          productId: "product-123",
          status: "canceled",
          createdAt: new Date("2024-01-01"),
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockSubscriptions),
          }),
        }),
      });

      const { getUserSubscription } = await import("./subscription");

      const result = await getUserSubscription("user-123");

      // Should return the most recent active/trialing subscription
      expect(result?.subscriptionId).toBe("sub-trialing");
      expect(result?.status).toBe("trialing");
    });
  });

  describe("getUserPayments", () => {
    it("should return user payments with default limit", async () => {
      const mockPayments = [
        {
          id: "payment1",
          userId: "user-123",
          paymentId: "pay-123",
          productId: "product-123",
          amount: 1000,
          currency: "usd",
          status: "succeeded",
          createdAt: new Date("2024-01-01"),
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockPayments),
            }),
          }),
        }),
      });

      const { getUserPayments } = await import("./subscription");

      const result = await getUserPayments("user-123");

      expect(result).toEqual([
        {
          ...mockPayments[0],
          tierId: "tier_pro",
          tierName: "Pro Plan",
        },
      ]);

      expect(mockGetProductTierByProductId).toHaveBeenCalledWith("product-123");
    });

    it("should respect custom limit", async () => {
      const mockLimit = jest.fn().mockResolvedValue([]);

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: mockLimit,
            }),
          }),
        }),
      });

      const { getUserPayments } = await import("./subscription");

      await getUserPayments("user-123", 25);

      expect(mockLimit).toHaveBeenCalledWith(25);
    });

    it("should fallback to tier by ID when product tier not found", async () => {
      const mockPayments = [
        {
          id: "payment1",
          userId: "user-123",
          paymentId: "pay-123",
          productId: "tier-123",
          amount: 1000,
          currency: "usd",
          status: "succeeded",
          createdAt: new Date("2024-01-01"),
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockPayments),
            }),
          }),
        }),
      });

      mockGetProductTierByProductId.mockReturnValue(null);

      const { getUserPayments } = await import("./subscription");

      const result = await getUserPayments("user-123");

      expect(result[0].tierId).toBe("tier_basic");
      expect(result[0].tierName).toBe("Basic Plan");
      expect(mockGetProductTierById).toHaveBeenCalledWith("tier-123");
    });

    it("should handle unknown products gracefully", async () => {
      const mockPayments = [
        {
          id: "payment1",
          userId: "user-123",
          paymentId: "pay-123",
          productId: "unknown-product",
          amount: 1000,
          currency: "usd",
          status: "succeeded",
          createdAt: new Date("2024-01-01"),
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockPayments),
            }),
          }),
        }),
      });

      mockGetProductTierByProductId.mockReturnValue(null);
      mockGetProductTierById.mockReturnValue(null);

      const { getUserPayments } = await import("./subscription");

      const result = await getUserPayments("user-123");

      expect(result[0].tierId).toBe("unknown-product");
      expect(result[0].tierName).toBe("Unknown Product");
    });
  });

  describe("isWebhookEventProcessed", () => {
    it("should return true when event already processed", async () => {
      const mockEvent = {
        eventId: "event-123",
        provider: "creem",
        processed: true,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockEvent]),
          }),
        }),
      });

      const { isWebhookEventProcessed } = await import("./subscription");

      const result = await isWebhookEventProcessed("event-123");

      expect(result).toBe(true);
      expect(mockEq).toHaveBeenCalledWith(
        mockWebhookEvents.eventId,
        "event-123",
      );
      expect(mockEq).toHaveBeenCalledWith(mockWebhookEvents.provider, "creem");
    });

    it("should return false when event not processed", async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const { isWebhookEventProcessed } = await import("./subscription");

      const result = await isWebhookEventProcessed("event-123");

      expect(result).toBe(false);
    });

    it("should use custom provider", async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const { isWebhookEventProcessed } = await import("./subscription");

      await isWebhookEventProcessed("event-123", "stripe");

      expect(mockEq).toHaveBeenCalledWith(mockWebhookEvents.provider, "stripe");
    });

    it("should work with transaction", async () => {
      const mockTx = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      const { isWebhookEventProcessed } = await import("./subscription");

      await isWebhookEventProcessed("event-123", "creem", mockTx as any);

      expect(mockTx.select).toHaveBeenCalled();
    });
  });

  describe("recordWebhookEvent", () => {
    it("should record webhook event with all parameters", async () => {
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: jest.fn().mockResolvedValue([]),
        }),
      });

      const { recordWebhookEvent } = await import("./subscription");

      await recordWebhookEvent(
        "event-123",
        "payment.succeeded",
        "creem",
        '{"eventType":"payment.succeeded"}',
      );

      expect(mockDb.insert).toHaveBeenCalledWith(mockWebhookEvents);
    });

    it("should use default provider when not specified", async () => {
      const { recordWebhookEvent } = await import("./subscription");

      await recordWebhookEvent("event-123", "payment.succeeded");

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should handle optional payload", async () => {
      const { recordWebhookEvent } = await import("./subscription");

      await recordWebhookEvent("event-123", "payment.succeeded", "creem");

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should work with transaction", async () => {
      const mockTx = {
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({
            onConflictDoNothing: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const { recordWebhookEvent } = await import("./subscription");

      await recordWebhookEvent(
        "event-123",
        "payment.succeeded",
        "creem",
        undefined,
        mockTx as any,
      );

      expect(mockTx.insert).toHaveBeenCalledWith(mockWebhookEvents);
    });

    it("should ignore conflicts gracefully", async () => {
      const mockOnConflictDoNothing = jest.fn().mockResolvedValue([]);

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: mockOnConflictDoNothing,
        }),
      });

      const { recordWebhookEvent } = await import("./subscription");

      await recordWebhookEvent("event-123", "payment.succeeded");

      expect(mockOnConflictDoNothing).toHaveBeenCalled();
    });
  });

  describe("Helper function getDb", () => {
    it("should return transaction when provided", async () => {
      const mockTx = { select: jest.fn() };

      // Test indirectly through a function that uses getDb
      const { findUserByCustomerId } = await import("./subscription");

      mockTx.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await findUserByCustomerId("customer-123", mockTx as any);

      expect(mockTx.select).toHaveBeenCalled();
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it("should return db when no transaction provided", async () => {
      const { findUserByCustomerId } = await import("./subscription");

      await findUserByCustomerId("customer-123");

      expect(mockDb.select).toHaveBeenCalled();
    });
  });
});
