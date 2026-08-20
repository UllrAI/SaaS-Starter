import type { CreateCheckoutOptions } from "@/types/billing";
import type { PaymentProvider } from "../provider";

const mockStripeClient = {
  checkout: {
    sessions: { create: jest.fn(), retrieve: jest.fn() },
  },
  customers: { create: jest.fn(), search: jest.fn() },
  billingPortal: { sessions: { create: jest.fn() } },
  subscriptions: { cancel: jest.fn(), update: jest.fn() },
};
const mockGetStripeCatalogItem = jest.fn();
const mockGetActiveStripePriceId = jest.fn();
const mockHandleStripeWebhook = jest.fn();

jest.mock("./client", () => ({
  getStripeClient: () => mockStripeClient,
}));
jest.mock("@/lib/config/integrations", () => ({
  getBillingConfig: () => ({
    apiKey: "sk_test_key",
    environment: "test_mode",
    webhookSecret: "whsec_secret",
  }),
}));
jest.mock("./prices", () => ({
  getStripeCatalogItem: mockGetStripeCatalogItem,
  getActiveStripePriceId: mockGetActiveStripePriceId,
}));
jest.mock("./webhook", () => ({
  handleStripeWebhook: mockHandleStripeWebhook,
}));

let stripeProvider: PaymentProvider;

const catalogItem = {
  productId: "prod_plus",
  oneTime: "price_once",
  monthly: "price_monthly",
  yearly: "price_yearly",
};
const checkoutOptions: CreateCheckoutOptions = {
  requestId: "22a24fd6-c394-4c09-b1df-fd93a2e16d20",
  tierId: "plus",
  userId: "user_123",
  customerId: "cus_123",
  paymentMode: "subscription",
  billingCycle: "monthly",
  successUrl: "https://example.com/payment-status?status=pending",
  cancelUrl: "https://example.com/payment-status?status=cancelled",
};

describe("Stripe provider", () => {
  beforeAll(async () => {
    stripeProvider = (await import("./provider")).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStripeCatalogItem.mockReturnValue(catalogItem);
    mockGetActiveStripePriceId.mockImplementation(
      (
        _tierId: string,
        _environment: string,
        variant: "oneTime" | "monthly" | "yearly",
      ) => catalogItem[variant],
    );
    mockStripeClient.checkout.sessions.create.mockResolvedValue({
      id: "cs_123",
      url: "https://checkout.stripe.com/c/pay/cs_123",
    });
    mockStripeClient.customers.search.mockResolvedValue({ data: [] });
  });

  it.each([
    ["subscription", "monthly", "price_monthly", "subscription"],
    ["subscription", "yearly", "price_yearly", "subscription"],
    ["one_time", undefined, "price_once", "payment"],
  ] as const)(
    "creates %s/%s checkout with the configured price",
    async (paymentMode, billingCycle, expectedPrice, stripeMode) => {
      await expect(
        stripeProvider.createCheckoutSession({
          ...checkoutOptions,
          paymentMode,
          billingCycle,
        }),
      ).resolves.toEqual({
        checkoutUrl: "https://checkout.stripe.com/c/pay/cs_123",
      });

      expect(mockStripeClient.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: stripeMode,
          customer: "cus_123",
          client_reference_id: "user_123",
          integration_identifier: "saas_starter_qjmxnrvk",
          line_items: [{ price: expectedPrice, quantity: 1 }],
          success_url:
            "https://example.com/payment-status?status=pending&session_id={CHECKOUT_SESSION_ID}",
          cancel_url: "https://example.com/payment-status?status=cancelled",
          metadata: {
            userId: "user_123",
            tierId: "plus",
            paymentMode,
            billingCycle: billingCycle ?? "",
          },
        }),
        {
          idempotencyKey:
            "billing-checkout:22a24fd6-c394-4c09-b1df-fd93a2e16d20",
        },
      );
    },
  );

  it("creates customers with a per-user idempotency key", async () => {
    mockStripeClient.customers.create.mockResolvedValue({ id: "cus_new" });

    await expect(
      stripeProvider.createCustomer({
        userId: "user_123",
        email: "user@example.com",
        name: "Taylor",
      }),
    ).resolves.toEqual({ customerId: "cus_new" });
    expect(mockStripeClient.customers.create).toHaveBeenCalledWith(
      {
        email: "user@example.com",
        name: "Taylor",
        metadata: { userId: "user_123" },
      },
      { idempotencyKey: "billing-customer:user_123" },
    );
    expect(mockStripeClient.customers.search).toHaveBeenCalledWith({
      query: "metadata['userId']:'user_123'",
      limit: 2,
    });
  });

  it("uses the durable asynchronous failure marker", async () => {
    mockStripeClient.checkout.sessions.retrieve.mockResolvedValue({
      status: "complete",
      payment_status: "unpaid",
      client_reference_id: "user_123",
      metadata: {
        paymentMode: "subscription",
        asyncPaymentStatus: "failed",
      },
    });

    await expect(
      stripeProvider.getCheckoutStatus("cs_failed"),
    ).resolves.toEqual(expect.objectContaining({ status: "failed" }));
  });

  it("reuses the canonical customer found after an idempotency window", async () => {
    mockStripeClient.customers.search.mockResolvedValue({
      data: [{ id: "cus_existing" }],
    });

    await expect(
      stripeProvider.createCustomer({
        userId: "user_123",
        email: "user@example.com",
      }),
    ).resolves.toEqual({ customerId: "cus_existing" });
    expect(mockStripeClient.customers.create).not.toHaveBeenCalled();
  });

  it("fails closed when customer metadata is ambiguous", async () => {
    mockStripeClient.customers.search.mockResolvedValue({
      data: [{ id: "cus_one" }, { id: "cus_two" }],
    });

    await expect(
      stripeProvider.createCustomer({
        userId: "user_123",
        email: "user@example.com",
      }),
    ).rejects.toThrow("multiple customers");
    expect(mockStripeClient.customers.create).not.toHaveBeenCalled();
  });

  it("escapes customer metadata search values", async () => {
    mockStripeClient.customers.search.mockResolvedValue({ data: [] });
    mockStripeClient.customers.create.mockResolvedValue({ id: "cus_new" });

    await stripeProvider.createCustomer({
      userId: "user\\'quoted",
      email: "user@example.com",
    });

    expect(mockStripeClient.customers.search).toHaveBeenCalledWith({
      query: "metadata['userId']:'user\\\\\\'quoted'",
      limit: 2,
    });
  });

  it("always checks out against the stored customer", async () => {
    await stripeProvider.createCheckoutSession(checkoutOptions);

    const params = mockStripeClient.checkout.sessions.create.mock.calls[0][0];
    // Letting Stripe create the customer would orphan it from the user record.
    expect(params.customer).toBe("cus_123");
    expect(params.customer_email).toBeUndefined();
    expect(params.customer_creation).toBeUndefined();
  });

  it("configures subscription and one-time metadata on the owned object", async () => {
    await stripeProvider.createCheckoutSession(checkoutOptions);
    let params = mockStripeClient.checkout.sessions.create.mock.calls[0][0];
    expect(params.subscription_data?.metadata).toEqual(params.metadata);

    await stripeProvider.createCheckoutSession({
      ...checkoutOptions,
      paymentMode: "one_time",
      billingCycle: undefined,
    });
    params = mockStripeClient.checkout.sessions.create.mock.calls[1][0];
    expect(params.payment_intent_data?.metadata).toEqual(params.metadata);
  });

  it("rejects missing cancel URLs and price configuration", async () => {
    await expect(
      stripeProvider.createCheckoutSession({
        ...checkoutOptions,
        cancelUrl: undefined,
      }),
    ).rejects.toThrow("cancel URL is required");

    mockGetActiveStripePriceId.mockReturnValue(undefined);
    await expect(
      stripeProvider.createCheckoutSession(checkoutOptions),
    ).rejects.toThrow("Stripe price ID not found");
  });

  it("rejects Stripe sessions without a hosted URL", async () => {
    mockStripeClient.checkout.sessions.create.mockResolvedValue({
      id: "cs_123",
      url: null,
    });
    await expect(
      stripeProvider.createCheckoutSession(checkoutOptions),
    ).rejects.toThrow("without a URL");
  });

  it.each([
    ["complete", "paid", "success"],
    ["complete", "no_payment_required", "success"],
    ["complete", "unpaid", "pending"],
    ["open", "unpaid", "pending"],
    ["expired", "unpaid", "failed"],
  ] as const)(
    "maps %s/%s checkout to %s",
    async (status, paymentStatus, expected) => {
      mockStripeClient.checkout.sessions.retrieve.mockResolvedValue({
        status,
        payment_status: paymentStatus,
        client_reference_id: "user_123",
        metadata: { paymentMode: "subscription" },
      });
      await expect(stripeProvider.getCheckoutStatus("cs_123")).resolves.toEqual(
        {
          status: expected,
          ownerId: "user_123",
          paymentMode: "subscription",
        },
      );
      expect(mockStripeClient.checkout.sessions.retrieve).toHaveBeenCalledWith(
        "cs_123",
        { expand: ["payment_intent", "subscription"] },
      );
    },
  );

  it.each([
    {
      payment_intent: { status: "requires_payment_method" },
      subscription: null,
    },
    {
      payment_intent: null,
      subscription: { status: "incomplete_expired" },
    },
  ])("maps terminal asynchronous failures to failed", async (expandedState) => {
    mockStripeClient.checkout.sessions.retrieve.mockResolvedValue({
      status: "complete",
      payment_status: "unpaid",
      client_reference_id: "user_123",
      metadata: { paymentMode: "subscription" },
      ...expandedState,
    });

    await expect(
      stripeProvider.getCheckoutStatus("cs_failed"),
    ).resolves.toEqual({
      status: "failed",
      ownerId: "user_123",
      paymentMode: "subscription",
    });
  });

  it("creates portal sessions and supports both cancellation modes", async () => {
    mockStripeClient.billingPortal.sessions.create.mockResolvedValue({
      url: "https://billing.stripe.com/p/session/test_123",
    });
    await expect(
      stripeProvider.createCustomerPortalUrl("cus_123"),
    ).resolves.toEqual({
      portalUrl: "https://billing.stripe.com/p/session/test_123",
    });

    await stripeProvider.cancelSubscription("sub_123", { mode: "immediate" });
    expect(mockStripeClient.subscriptions.cancel).toHaveBeenCalledWith(
      "sub_123",
    );
    await stripeProvider.cancelSubscription("sub_456", { mode: "scheduled" });
    expect(mockStripeClient.subscriptions.update).toHaveBeenCalledWith(
      "sub_456",
      { cancel_at_period_end: true },
    );
  });

  it("delegates verified webhook processing", async () => {
    mockHandleStripeWebhook.mockResolvedValue({ received: true });
    await expect(
      stripeProvider.handleWebhook("payload", "signature"),
    ).resolves.toEqual({ received: true });
    expect(mockHandleStripeWebhook).toHaveBeenCalledWith(
      "payload",
      "signature",
    );
  });
});
