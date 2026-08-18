import type { CreateCheckoutOptions } from "@/types/billing";
import type { PaymentProvider } from "../provider";

const mockStripeClient = {
  checkout: {
    sessions: { create: jest.fn(), retrieve: jest.fn() },
  },
  billingPortal: { sessions: { create: jest.fn() } },
  subscriptions: { cancel: jest.fn(), update: jest.fn() },
};
const mockGetStripePriceIds = jest.fn();
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
  getStripePriceIds: mockGetStripePriceIds,
}));
jest.mock("./webhook", () => ({
  handleStripeWebhook: mockHandleStripeWebhook,
}));

let stripeProvider: PaymentProvider;

const priceIds = {
  oneTime: "price_once",
  monthly: "price_monthly",
  yearly: "price_yearly",
};
const checkoutOptions: CreateCheckoutOptions = {
  requestId: "22a24fd6-c394-4c09-b1df-fd93a2e16d20",
  tierId: "plus",
  userId: "user_123",
  userEmail: "user@example.com",
  userName: "Taylor",
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
    mockGetStripePriceIds.mockReturnValue(priceIds);
    mockStripeClient.checkout.sessions.create.mockResolvedValue({
      id: "cs_123",
      url: "https://checkout.stripe.com/c/pay/cs_123",
    });
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
          client_reference_id: "user_123",
          customer_email: "user@example.com",
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

  it("reuses an existing Stripe customer", async () => {
    await stripeProvider.createCheckoutSession({
      ...checkoutOptions,
      customerId: "cus_123",
    });

    expect(mockStripeClient.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_123" }),
      expect.anything(),
    );
    const params = mockStripeClient.checkout.sessions.create.mock.calls[0][0];
    expect(params.customer_email).toBeUndefined();
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
    expect(params.customer_creation).toBe("always");
    expect(params.payment_intent_data?.metadata).toEqual(params.metadata);
  });

  it("rejects missing cancel URLs and price configuration", async () => {
    await expect(
      stripeProvider.createCheckoutSession({
        ...checkoutOptions,
        cancelUrl: undefined,
      }),
    ).rejects.toThrow("cancel URL is required");

    mockGetStripePriceIds.mockReturnValue({ ...priceIds, monthly: "" });
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
    },
  );

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
