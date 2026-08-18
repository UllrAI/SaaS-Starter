import type Stripe from "stripe";

const mockConstructEvent = jest.fn();
const mockListInvoicePayments = jest.fn();
const mockTransaction = jest.fn();
const mockClaimWebhookEvent = jest.fn();
const mockLogStripeWebhook = jest.fn();
const mockProcessCheckoutSession = jest.fn();
const mockProcessSubscription = jest.fn();
const mockProcessInvoice = jest.fn();
const mockProcessRefund = jest.fn();
const mockProcessDispute = jest.fn();

jest.mock("@/database", () => ({
  db: { transaction: mockTransaction },
}));
jest.mock("@/lib/config/integrations", () => ({
  getBillingConfig: () => ({
    apiKey: "sk_test_key",
    environment: "test_mode",
    webhookSecret: "whsec_secret",
  }),
}));
jest.mock("@/lib/database/subscription", () => ({
  claimWebhookEvent: mockClaimWebhookEvent,
}));
jest.mock("./client", () => ({
  getStripeClient: () => ({
    webhooks: { constructEvent: mockConstructEvent },
    invoicePayments: { list: mockListInvoicePayments },
  }),
}));
jest.mock("./webhook-log", () => ({
  logStripeWebhook: mockLogStripeWebhook,
}));
jest.mock("./webhook-processors", () => {
  class InvalidWebhookPayloadError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = "InvalidWebhookPayloadError";
    }
  }
  return {
    InvalidWebhookPayloadError,
    processCheckoutSession: mockProcessCheckoutSession,
    processSubscription: mockProcessSubscription,
    processInvoice: mockProcessInvoice,
    processRefund: mockProcessRefund,
    processDispute: mockProcessDispute,
  };
});

function event(
  type: Stripe.Event.Type,
  object: object,
  overrides: Partial<Stripe.Event> = {},
): Stripe.Event {
  return {
    id: "evt_123",
    object: "event",
    api_version: "2026-07-29.basil",
    created: 1_700_000_000,
    data: { object },
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type,
    ...overrides,
  } as Stripe.Event;
}

describe("Stripe webhook handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClaimWebhookEvent.mockResolvedValue(true);
    mockListInvoicePayments.mockResolvedValue({ data: [] });
    mockTransaction.mockImplementation(async (callback) => callback({}));
  });

  it("rejects invalid signatures before parsing event data", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("No signatures found");
    });
    const { handleStripeWebhook, StripeWebhookSignatureError } =
      await import("./webhook");

    await expect(
      handleStripeWebhook("payload", "bad-signature"),
    ).rejects.toBeInstanceOf(StripeWebhookSignatureError);
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockLogStripeWebhook).toHaveBeenCalledWith("warn", {
      eventId: null,
      eventType: null,
      outcome: "invalid_signature",
    });
  });

  it("rejects live events at a test endpoint", async () => {
    mockConstructEvent.mockReturnValue(
      event("checkout.session.completed", {}, { livemode: true }),
    );
    const { handleStripeWebhook, StripeWebhookEnvironmentError } =
      await import("./webhook");

    await expect(
      handleStripeWebhook("payload", "signature"),
    ).rejects.toBeInstanceOf(StripeWebhookEnvironmentError);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("claims and processes checkout events atomically", async () => {
    const checkout = { id: "cs_123" };
    mockConstructEvent.mockReturnValue(
      event("checkout.session.completed", checkout),
    );
    const { handleStripeWebhook } = await import("./webhook");

    await expect(handleStripeWebhook("payload", "signature")).resolves.toEqual({
      received: true,
    });
    expect(mockClaimWebhookEvent).toHaveBeenCalledWith(
      "evt_123",
      "checkout.session.completed",
      "stripe",
      {},
    );
    expect(mockProcessCheckoutSession).toHaveBeenCalledWith(
      checkout,
      new Date(1_700_000_000_000),
      {},
    );
    expect(mockLogStripeWebhook).toHaveBeenCalledWith("log", {
      eventId: "evt_123",
      eventType: "checkout.session.completed",
      outcome: "processed",
    });
  });

  it("acknowledges duplicate events without repeating business writes", async () => {
    mockConstructEvent.mockReturnValue(
      event("customer.subscription.updated", { id: "sub_123" }),
    );
    mockClaimWebhookEvent.mockResolvedValue(false);
    const { handleStripeWebhook } = await import("./webhook");

    await expect(handleStripeWebhook("payload", "signature")).resolves.toEqual({
      received: true,
    });
    expect(mockProcessSubscription).not.toHaveBeenCalled();
    expect(mockLogStripeWebhook).toHaveBeenCalledWith(
      "log",
      expect.objectContaining({ outcome: "duplicate" }),
    );
  });

  it("resolves invoice IDs before applying subscription refunds", async () => {
    const charge = {
      id: "ch_123",
      payment_intent: "pi_123",
    };
    mockConstructEvent.mockReturnValue(event("charge.refunded", charge));
    mockListInvoicePayments.mockResolvedValue({
      data: [{ invoice: "in_123" }],
    });
    const { handleStripeWebhook } = await import("./webhook");

    await handleStripeWebhook("payload", "signature");
    expect(mockListInvoicePayments).toHaveBeenCalledWith({
      payment: { type: "payment_intent", payment_intent: "pi_123" },
      limit: 10,
    });
    expect(mockProcessRefund).toHaveBeenCalledWith(
      charge,
      ["ch_123", "pi_123", "in_123"],
      new Date(1_700_000_000_000),
      {},
    );
  });

  it("claims unsupported events and records them as ignored", async () => {
    mockConstructEvent.mockReturnValue(event("product.updated", {}));
    const { handleStripeWebhook } = await import("./webhook");

    await handleStripeWebhook("payload", "signature");
    expect(mockLogStripeWebhook).toHaveBeenCalledWith("log", {
      eventId: "evt_123",
      eventType: "product.updated",
      outcome: "ignored",
    });
  });
});
