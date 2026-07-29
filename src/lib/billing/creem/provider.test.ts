import type { CreateCheckoutOptions } from "@/types/billing";
import type { PaymentProvider } from "../provider";

const mockCreemClient = {
  checkouts: { create: jest.fn(), retrieve: jest.fn() },
  customers: { generateBillingLinks: jest.fn() },
  subscriptions: { cancel: jest.fn() },
};
const mockGetCreemProductIds = jest.fn();
const mockHandleCreemWebhook = jest.fn();

jest.mock("./client", () => ({
  creemClient: mockCreemClient,
  creemEnvironment: "live_mode",
  creemWebhookSecret: "webhook-secret",
}));
jest.mock("./products", () => ({
  getCreemProductIds: mockGetCreemProductIds,
}));
jest.mock("./webhook", () => ({
  handleCreemWebhook: mockHandleCreemWebhook,
}));

let creemProvider: PaymentProvider;

const productIds = {
  oneTime: "prod_once",
  monthly: "prod_monthly",
  yearly: "prod_yearly",
};

const checkoutOptions: CreateCheckoutOptions = {
  requestId: "req_123",
  tierId: "plus",
  userId: "user_123",
  userEmail: "user@example.com",
  userName: "Taylor",
  paymentMode: "subscription",
  billingCycle: "monthly",
  successUrl: "https://example.com/success",
  cancelUrl: "https://example.com/cancel",
  failureUrl: "https://example.com/failure",
};

describe("Creem provider", () => {
  beforeAll(async () => {
    creemProvider = (await import("./provider")).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockGetCreemProductIds.mockReturnValue(productIds);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ["subscription", "monthly", "prod_monthly"],
    ["subscription", "yearly", "prod_yearly"],
    ["one_time", "monthly", "prod_once"],
  ] as const)(
    "selects the configured product for %s/%s",
    async (paymentMode, billingCycle, expectedProductId) => {
      mockCreemClient.checkouts.create.mockResolvedValue({
        checkoutUrl: "https://checkout.creem.io/ch_123",
      });

      await expect(
        creemProvider.createCheckoutSession({
          ...checkoutOptions,
          paymentMode,
          billingCycle,
        }),
      ).resolves.toEqual({
        checkoutUrl: "https://checkout.creem.io/ch_123",
      });

      expect(mockCreemClient.checkouts.create).toHaveBeenCalledWith({
        requestId: "req_123",
        productId: expectedProductId,
        successUrl: "https://example.com/success",
        customer: {
          email: "user@example.com",
        },
        metadata: {
          userId: "user_123",
          tierId: "plus",
          paymentMode,
          billingCycle,
        },
      });
    },
  );

  it("rejects unknown tiers before contacting Creem", async () => {
    mockGetCreemProductIds.mockReturnValue(undefined);

    await expect(
      creemProvider.createCheckoutSession(checkoutOptions),
    ).rejects.toThrow('Pricing tier with id "plus" not found.');
    expect(mockCreemClient.checkouts.create).not.toHaveBeenCalled();
  });

  it("rejects missing product configuration", async () => {
    mockGetCreemProductIds.mockReturnValue({
      ...productIds,
      monthly: "",
    });

    await expect(
      creemProvider.createCheckoutSession(checkoutOptions),
    ).rejects.toThrow("Creem product ID not found");
  });

  it("rejects malformed checkout responses", async () => {
    mockCreemClient.checkouts.create.mockResolvedValue({ status: "pending" });

    await expect(
      creemProvider.createCheckoutSession(checkoutOptions),
    ).rejects.toThrow("Failed to parse checkout response from Creem");
  });

  it("preserves controlled client error messages", async () => {
    mockCreemClient.checkouts.create.mockRejectedValue(
      new Error("Creem request failed (create checkout, HTTP 503)."),
    );

    await expect(
      creemProvider.createCheckoutSession(checkoutOptions),
    ).rejects.toThrow(
      "Failed to create checkout session: Creem request failed (create checkout, HTTP 503).",
    );
  });

  it("creates and validates customer portal links", async () => {
    mockCreemClient.customers.generateBillingLinks.mockResolvedValue({
      customerPortalLink: "https://creem.io/portal/cust_123",
    });

    await expect(
      creemProvider.createCustomerPortalUrl("cust_123"),
    ).resolves.toEqual({
      portalUrl: "https://creem.io/portal/cust_123",
    });
    expect(mockCreemClient.customers.generateBillingLinks).toHaveBeenCalledWith(
      { customerId: "cust_123" },
    );
  });

  it("rejects malformed portal links", async () => {
    mockCreemClient.customers.generateBillingLinks.mockResolvedValue({
      customerPortalLink: "not-a-url",
    });

    await expect(
      creemProvider.createCustomerPortalUrl("cust_123"),
    ).rejects.toThrow("Failed to parse customer portal response from Creem");
  });

  it.each([
    ["completed", "success"],
    ["succeeded", "success"],
    ["failed", "failed"],
    ["expired", "failed"],
    ["canceled", "cancelled"],
    ["cancelled", "cancelled"],
    ["processing", "pending"],
    ["unknown", "pending"],
  ] as const)("normalizes checkout status %s", async (status, expected) => {
    mockCreemClient.checkouts.retrieve.mockResolvedValue({
      status,
      metadata: {
        userId: "user_123",
        paymentMode: "subscription",
      },
    });

    await expect(
      creemProvider.getCheckoutStatus("checkout_123"),
    ).resolves.toEqual({
      status: expected,
      ownerId: "user_123",
      paymentMode: "subscription",
    });
  });

  it("allowlists checkout ownership metadata", async () => {
    mockCreemClient.checkouts.retrieve.mockResolvedValue({
      status: "open",
      metadata: {
        userId: 123,
        paymentMode: "invalid",
      },
    });

    await expect(
      creemProvider.getCheckoutStatus("checkout_123"),
    ).resolves.toEqual({
      status: "pending",
      ownerId: null,
      paymentMode: null,
    });
  });

  it("cancels subscriptions through the Creem client", async () => {
    mockCreemClient.subscriptions.cancel.mockResolvedValue({
      id: "subscription_123",
      status: "canceled",
    });

    await expect(
      creemProvider.cancelSubscription("subscription_123", {
        mode: "immediate",
      }),
    ).resolves.toBeUndefined();
    expect(mockCreemClient.subscriptions.cancel).toHaveBeenCalledWith(
      "subscription_123",
      { mode: "immediate" },
    );
  });

  it("delegates verified webhook processing", async () => {
    mockHandleCreemWebhook.mockResolvedValue({ received: true });

    await expect(
      creemProvider.handleWebhook("payload", "signature"),
    ).resolves.toEqual({ received: true });
    expect(mockHandleCreemWebhook).toHaveBeenCalledWith("payload", "signature");
  });
});
