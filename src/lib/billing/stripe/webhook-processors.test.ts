import type Stripe from "stripe";

const mockFindUserByCustomerId = jest.fn();
const mockGrantProductEntitlement = jest.fn();
const mockLockBillingProductScope = jest.fn();
const mockLockPaymentAdjustmentScope = jest.fn();
const mockRevokeProductEntitlementByPaymentId = jest.fn();
const mockSuspendSubscriptionAccess = jest.fn();
const mockUpdatePaymentStatus = jest.fn();
const mockUpsertPayment = jest.fn();
const mockUpsertSubscription = jest.fn();
const mockGetProductTierByStripeProductId = jest.fn();

jest.mock("@/lib/database/subscription", () => ({
  findUserByCustomerId: mockFindUserByCustomerId,
  grantProductEntitlement: mockGrantProductEntitlement,
  lockBillingProductScope: mockLockBillingProductScope,
  lockPaymentAdjustmentScope: mockLockPaymentAdjustmentScope,
  revokeProductEntitlementByPaymentId: mockRevokeProductEntitlementByPaymentId,
  suspendSubscriptionAccess: mockSuspendSubscriptionAccess,
  updatePaymentStatus: mockUpdatePaymentStatus,
  upsertPayment: mockUpsertPayment,
  upsertSubscription: mockUpsertSubscription,
}));
jest.mock("./client", () => ({
  getStripeEnvironment: () => "test_mode",
}));
jest.mock("./prices", () => ({
  getProductTierByStripeProductId: mockGetProductTierByStripeProductId,
}));

const tx = {} as never;
const tier = { id: "pro", name: "Professional" };

/** Minimal Drizzle stub for the `resolveUserId` fallback lookup. */
function createUserLookupTx(
  user?: { id: string; paymentProviderCustomerId: string | null },
  claimSucceeds = true,
) {
  const setCustomerId = jest.fn();
  return {
    setCustomerId,
    tx: {
      select: () => ({
        from: () => ({
          where: () => ({ limit: async () => (user ? [user] : []) }),
        }),
      }),
      update: () => ({
        set: (values: { paymentProviderCustomerId: string }) => ({
          where: () => ({
            returning: async () => {
              setCustomerId(values.paymentProviderCustomerId);
              return claimSucceeds ? [{ id: user?.id }] : [];
            },
          }),
        }),
      }),
    } as never,
  };
}

describe("Stripe webhook processors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUserByCustomerId.mockResolvedValue({ id: "user_123" });
    mockGetProductTierByStripeProductId.mockReturnValue(tier);
    mockUpsertPayment.mockResolvedValue([{ status: "succeeded" }]);
  });

  it("records a paid one-time checkout and grants its entitlement", async () => {
    const { processCheckoutSession } = await import("./webhook-processors");
    const session = {
      id: "cs_123",
      customer: "cus_123",
      client_reference_id: "user_123",
      payment_status: "paid",
      payment_intent: "pi_123",
      subscription: null,
      amount_total: 2999,
      currency: "usd",
      metadata: {
        userId: "user_123",
        tierId: "pro",
        paymentMode: "one_time",
      },
    } as unknown as Stripe.Checkout.Session;

    await processCheckoutSession(session, new Date("2026-08-18T00:00:00Z"), tx);
    expect(mockUpsertPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_123",
        customerId: "cus_123",
        productId: "pro",
        paymentId: "pi_123",
        paymentIntentId: "pi_123",
        amount: 2999,
        currency: "usd",
        paymentType: "one_time",
        status: "succeeded",
      }),
      tx,
    );
    expect(mockGrantProductEntitlement).toHaveBeenCalledWith(
      {
        userId: "user_123",
        productId: "pro",
        sourcePaymentId: "pi_123",
      },
      tx,
    );
  });

  it("does not grant access for an unpaid asynchronous checkout", async () => {
    const { processCheckoutSession } = await import("./webhook-processors");
    await processCheckoutSession(
      {
        payment_status: "unpaid",
      } as Stripe.Checkout.Session,
      new Date(),
      tx,
    );
    expect(mockUpsertPayment).not.toHaveBeenCalled();
    expect(mockGrantProductEntitlement).not.toHaveBeenCalled();
  });

  it("books a fully discounted checkout against the session", async () => {
    const { processCheckoutSession } = await import("./webhook-processors");
    const session = {
      id: "cs_123",
      customer: "cus_123",
      client_reference_id: "user_123",
      // Stripe creates no PaymentIntent when a coupon zeroes the total.
      payment_status: "no_payment_required",
      payment_intent: null,
      subscription: null,
      amount_total: 0,
      currency: "usd",
      metadata: { userId: "user_123", tierId: "pro", paymentMode: "one_time" },
    } as unknown as Stripe.Checkout.Session;

    await processCheckoutSession(session, new Date(), tx);
    expect(mockUpsertPayment).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: "cs_123", amount: 0 }),
      tx,
    );
    expect(mockGrantProductEntitlement).toHaveBeenCalledWith(
      { userId: "user_123", productId: "pro", sourcePaymentId: "cs_123" },
      tx,
    );
  });

  it("rejects a second Stripe customer for the same user", async () => {
    mockFindUserByCustomerId.mockResolvedValue(null);
    const { setCustomerId, tx: lookupTx } = createUserLookupTx({
      id: "user_123",
      paymentProviderCustomerId: "cus_stored",
    });
    const consoleWarn = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    const { processCheckoutSession } = await import("./webhook-processors");

    await expect(
      processCheckoutSession(
        {
          id: "cs_123",
          customer: "cus_dashboard",
          client_reference_id: "user_123",
          payment_status: "paid",
          payment_intent: "pi_123",
          subscription: null,
          amount_total: 2999,
          currency: "usd",
          metadata: {
            userId: "user_123",
            tierId: "pro",
            paymentMode: "one_time",
          },
        } as unknown as Stripe.Checkout.Session,
        new Date(),
        lookupTx,
      ),
    ).rejects.toThrow("does not match the stored customer");
    consoleWarn.mockRestore();
    expect(setCustomerId).not.toHaveBeenCalled();
    expect(mockUpsertPayment).not.toHaveBeenCalled();
  });

  it("claims an unassigned Stripe customer exactly once", async () => {
    mockFindUserByCustomerId.mockResolvedValue(null);
    const { setCustomerId, tx: lookupTx } = createUserLookupTx({
      id: "user_123",
      paymentProviderCustomerId: null,
    });
    const { processCheckoutSession } = await import("./webhook-processors");

    await processCheckoutSession(
      {
        id: "cs_123",
        customer: "cus_first",
        client_reference_id: "user_123",
        payment_status: "paid",
        payment_intent: "pi_123",
        amount_total: 2999,
        currency: "usd",
        metadata: {
          userId: "user_123",
          tierId: "pro",
          paymentMode: "one_time",
        },
      } as unknown as Stripe.Checkout.Session,
      new Date(),
      lookupTx,
    );

    expect(setCustomerId).toHaveBeenCalledWith("cus_first");
    expect(mockUpsertPayment).toHaveBeenCalled();
  });

  it("rejects a customer claim lost to a concurrent event", async () => {
    mockFindUserByCustomerId.mockResolvedValue(null);
    const { tx: lookupTx } = createUserLookupTx(
      { id: "user_123", paymentProviderCustomerId: null },
      false,
    );
    const { processCheckoutSession } = await import("./webhook-processors");

    await expect(
      processCheckoutSession(
        {
          id: "cs_123",
          customer: "cus_lost",
          client_reference_id: "user_123",
          payment_status: "paid",
          payment_intent: "pi_123",
          amount_total: 2999,
          currency: "usd",
          metadata: {
            userId: "user_123",
            tierId: "pro",
            paymentMode: "one_time",
          },
        } as unknown as Stripe.Checkout.Session,
        new Date(),
        lookupTx,
      ),
    ).rejects.toThrow("ownership changed");
    expect(mockUpsertPayment).not.toHaveBeenCalled();
  });

  it("maps scheduled cancellation and Stripe billing periods", async () => {
    const { processSubscription } = await import("./webhook-processors");
    const subscription = {
      id: "sub_123",
      customer: "cus_123",
      status: "active",
      cancel_at_period_end: true,
      canceled_at: 1_700_000_100,
      metadata: { userId: "user_123", tierId: "pro" },
      items: {
        data: [
          {
            price: { id: "price_monthly", product: "prod_pro" },
            current_period_start: 1_700_000_000,
            current_period_end: 1_702_592_000,
          },
        ],
      },
    } as unknown as Stripe.Subscription;

    await processSubscription(
      subscription,
      new Date("2026-08-18T00:00:00Z"),
      tx,
    );
    expect(mockGetProductTierByStripeProductId).toHaveBeenCalledWith(
      "prod_pro",
      "test_mode",
    );
    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionId: "sub_123",
        status: "scheduled_cancel",
        currentPeriodStart: new Date(1_700_000_000_000),
        currentPeriodEnd: new Date(1_702_592_000_000),
        canceledAt: new Date(1_700_000_100_000),
      }),
      tx,
    );
  });

  it("rejects subscriptions with multiple price items", async () => {
    const { processSubscription } = await import("./webhook-processors");
    const item = {
      price: { id: "price_monthly", product: "prod_pro" },
      current_period_start: 1_700_000_000,
      current_period_end: 1_702_592_000,
    };

    await expect(
      processSubscription(
        {
          id: "sub_multi",
          customer: "cus_123",
          status: "active",
          cancel_at_period_end: false,
          canceled_at: null,
          metadata: { userId: "user_123", tierId: "pro" },
          items: { data: [item, item] },
        } as unknown as Stripe.Subscription,
        new Date(),
        tx,
      ),
    ).rejects.toThrow("exactly one price item");
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
  });

  it("trusts the price over stale tier metadata after a plan switch", async () => {
    const consoleWarn = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    const { processSubscription } = await import("./webhook-processors");
    const subscription = {
      id: "sub_123",
      customer: "cus_123",
      status: "active",
      cancel_at_period_end: false,
      canceled_at: null,
      // Stripe keeps the checkout-time metadata after a portal upgrade.
      metadata: { userId: "user_123", tierId: "plus" },
      items: {
        data: [
          {
            price: { id: "price_pro_monthly", product: "prod_pro" },
            current_period_start: 1_700_000_000,
            current_period_end: 1_702_592_000,
          },
        ],
      },
    } as unknown as Stripe.Subscription;

    try {
      await processSubscription(subscription, new Date(), tx);
    } finally {
      consoleWarn.mockRestore();
    }

    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ productId: "pro", status: "active" }),
      tx,
    );
  });

  it("records subscription invoices without overriding lifecycle state", async () => {
    const { processInvoice } = await import("./webhook-processors");
    const invoice = {
      id: "in_123",
      customer: "cus_123",
      amount_paid: 1999,
      amount_due: 1999,
      currency: "usd",
      period_start: 1_700_000_000,
      period_end: 1_702_592_000,
      metadata: {},
      parent: {
        subscription_details: {
          subscription: "sub_123",
          metadata: { userId: "user_123", tierId: "pro" },
        },
      },
      lines: {
        data: [
          {
            pricing: {
              price_details: { price: "price_monthly", product: "prod_pro" },
            },
          },
        ],
      },
    } as unknown as Stripe.Invoice;

    await processInvoice(invoice, "succeeded", new Date(), tx);
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
    expect(mockUpsertPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "in_123",
        amount: 1999,
        paymentType: "subscription",
        status: "succeeded",
      }),
      tx,
    );
  });

  it("books failed and retried invoices at the same amount", async () => {
    const { processInvoice } = await import("./webhook-processors");
    const invoice = {
      id: "in_123",
      customer: "cus_123",
      // A failed invoice has collected nothing yet; the retry collects it all.
      amount_paid: 0,
      amount_due: 1999,
      currency: "usd",
      metadata: {},
      parent: {
        subscription_details: {
          subscription: "sub_123",
          metadata: { userId: "user_123", tierId: "pro" },
        },
      },
      lines: {
        data: [
          {
            pricing: {
              price_details: { price: "price_monthly", product: "prod_pro" },
            },
          },
        ],
      },
    } as unknown as Stripe.Invoice;

    await processInvoice(invoice, "failed", new Date(), tx);
    expect(mockUpsertPayment).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1999, status: "failed" }),
      tx,
    );
  });

  it("uses the positive product for a multi-product proration invoice", async () => {
    const { processInvoice } = await import("./webhook-processors");
    const invoice = {
      id: "in_proration",
      customer: "cus_123",
      amount_due: 500,
      currency: "usd",
      metadata: {},
      parent: {
        subscription_details: {
          subscription: "sub_123",
          metadata: { userId: "user_123", tierId: "pro" },
        },
      },
      lines: {
        data: [
          {
            amount: -1000,
            parent: {
              subscription_item_details: {
                subscription: "sub_123",
                proration: true,
              },
            },
            pricing: {
              price_details: { price: "price_old", product: "prod_plus" },
            },
          },
          {
            amount: 1500,
            parent: {
              subscription_item_details: {
                subscription: "sub_123",
                proration: true,
              },
            },
            pricing: {
              price_details: { price: "price_new", product: "prod_pro" },
            },
          },
        ],
      },
    } as unknown as Stripe.Invoice;

    await processInvoice(invoice, "succeeded", new Date(), tx);
    expect(mockUpsertPayment).toHaveBeenCalledWith(
      expect.objectContaining({ productId: "pro", paymentId: "in_proration" }),
      tx,
    );
  });

  it("rejects an invoice with multiple positive subscription products", async () => {
    const { processInvoice } = await import("./webhook-processors");
    const line = (product: string) => ({
      amount: 1000,
      parent: {
        subscription_item_details: {
          subscription: "sub_123",
          proration: true,
        },
      },
      pricing: { price_details: { price: `price_${product}`, product } },
    });
    const invoice = {
      id: "in_ambiguous",
      customer: "cus_123",
      amount_due: 2000,
      currency: "usd",
      parent: {
        subscription_details: {
          subscription: "sub_123",
          metadata: { userId: "user_123", tierId: "pro" },
        },
      },
      lines: { data: [line("prod_plus"), line("prod_pro")] },
    } as unknown as Stripe.Invoice;

    await expect(
      processInvoice(invoice, "succeeded", new Date(), tx),
    ).rejects.toThrow("exactly one subscription product");
    expect(mockUpsertPayment).not.toHaveBeenCalled();
  });

  it("revokes fully refunded and disputed payments", async () => {
    const { processDispute, processRefund } =
      await import("./webhook-processors");
    mockLockPaymentAdjustmentScope.mockResolvedValue("pi_123");
    mockUpdatePaymentStatus.mockResolvedValue([{ subscriptionId: "sub_123" }]);
    const createdAt = new Date("2026-08-18T00:00:00Z");

    await processRefund(
      {
        amount: 2999,
        amount_refunded: 2999,
        refunded: true,
      } as Stripe.Charge,
      ["pi_123"],
      createdAt,
      tx,
    );
    expect(mockUpdatePaymentStatus).toHaveBeenCalledWith(
      "pi_123",
      "refunded",
      tx,
    );
    expect(mockRevokeProductEntitlementByPaymentId).toHaveBeenCalledWith(
      "pi_123",
      "refunded",
      tx,
    );

    await processDispute(["pi_123"], createdAt, tx);
    expect(mockUpdatePaymentStatus).toHaveBeenCalledWith(
      "pi_123",
      "disputed",
      tx,
    );
    expect(mockSuspendSubscriptionAccess).toHaveBeenCalledWith(
      "sub_123",
      createdAt,
      tx,
    );
  });
});
