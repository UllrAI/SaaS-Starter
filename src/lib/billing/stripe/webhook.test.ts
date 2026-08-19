import type Stripe from "stripe";

const mockConstructEvent = jest.fn();
const mockListInvoicePayments = jest.fn();
const mockTransaction = jest.fn();
const mockClaimWebhookEvent = jest.fn();
const mockIsWebhookEventProcessed = jest.fn();
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
  isWebhookEventProcessed: mockIsWebhookEventProcessed,
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
    api_version: "2026-07-29.dahlia",
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
    mockIsWebhookEventProcessed.mockResolvedValue(false);
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

  it("rejects endpoints pinned to an API version that predates Basil", async () => {
    mockConstructEvent.mockReturnValue(
      event(
        "customer.subscription.updated",
        { id: "sub_123" },
        { api_version: "2025-03-31.basil" },
      ),
    );
    const { handleStripeWebhook, StripeWebhookApiVersionError } =
      await import("./webhook");

    await expect(
      handleStripeWebhook("payload", "signature"),
    ).rejects.toBeInstanceOf(StripeWebhookApiVersionError);
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockLogStripeWebhook).toHaveBeenCalledWith("error", {
      eventId: "evt_123",
      eventType: "customer.subscription.updated",
      outcome: "api_version_unsupported",
    });
  });

  it("rejects structured events whose API version is missing", async () => {
    mockConstructEvent.mockReturnValue(
      event("invoice.paid", { id: "in_123" }, { api_version: null }),
    );
    const { handleStripeWebhook, StripeWebhookApiVersionError } =
      await import("./webhook");

    await expect(
      handleStripeWebhook("payload", "signature"),
    ).rejects.toBeInstanceOf(StripeWebhookApiVersionError);
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

  it("short-circuits redeliveries before touching Stripe or the database", async () => {
    mockConstructEvent.mockReturnValue(
      event("charge.refunded", { id: "ch_1" }),
    );
    mockIsWebhookEventProcessed.mockResolvedValue(true);
    const { handleStripeWebhook } = await import("./webhook");

    await expect(handleStripeWebhook("payload", "signature")).resolves.toEqual({
      received: true,
    });
    expect(mockListInvoicePayments).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockLogStripeWebhook).toHaveBeenCalledWith(
      "log",
      expect.objectContaining({ outcome: "duplicate" }),
    );
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

  it("passes persisted payment references to subscription refunds", async () => {
    const charge = {
      id: "ch_123",
      payment_intent: "pi_123",
    };
    mockConstructEvent.mockReturnValue(event("charge.refunded", charge));
    const { handleStripeWebhook } = await import("./webhook");

    await handleStripeWebhook("payload", "signature");
    expect(mockListInvoicePayments).not.toHaveBeenCalled();
    expect(mockProcessRefund).toHaveBeenCalledWith(
      charge,
      ["ch_123", "pi_123"],
      new Date(1_700_000_000_000),
      {},
    );
  });

  it("does not need a Stripe lookup before applying a refund", async () => {
    const charge = { id: "ch_123", payment_intent: "pi_123" };
    mockConstructEvent.mockReturnValue(event("charge.refunded", charge));
    const { handleStripeWebhook } = await import("./webhook");

    await handleStripeWebhook("payload", "signature");

    expect(mockListInvoicePayments).not.toHaveBeenCalled();
    expect(mockProcessRefund).toHaveBeenCalledWith(
      charge,
      ["ch_123", "pi_123"],
      new Date(1_700_000_000_000),
      {},
    );
  });

  it("persists the PaymentIntent discovered from an invoice payment", async () => {
    const invoice = { id: "in_123" };
    mockConstructEvent.mockReturnValue(event("invoice.paid", invoice));
    mockListInvoicePayments.mockResolvedValue({
      data: [
        {
          payment: { type: "payment_intent", payment_intent: "pi_invoice" },
        },
      ],
    });
    const { handleStripeWebhook } = await import("./webhook");

    await handleStripeWebhook("payload", "signature");
    expect(mockListInvoicePayments).toHaveBeenCalledWith({
      invoice: "in_123",
      limit: 10,
    });
    expect(mockProcessInvoice).toHaveBeenCalledWith(
      invoice,
      "succeeded",
      new Date(1_700_000_000_000),
      {},
      "pi_invoice",
    );
  });

  it("lets Stripe retry when invoice payment lookup fails", async () => {
    const invoice = { id: "in_123" };
    mockConstructEvent.mockReturnValue(event("invoice.paid", invoice));
    mockListInvoicePayments.mockRejectedValue(new Error("Stripe is down"));
    const { handleStripeWebhook } = await import("./webhook");

    await expect(handleStripeWebhook("payload", "signature")).rejects.toThrow(
      "Stripe is down",
    );
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockLogStripeWebhook).toHaveBeenCalledWith("warn", {
      eventId: "evt_123",
      eventType: "invoice.paid",
      outcome: "invoice_payment_lookup_failed",
    });
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
