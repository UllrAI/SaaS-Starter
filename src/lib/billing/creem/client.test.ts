import {
  CreemApiError,
  createCreemClient,
  type CreateCreemProductInput,
} from "./api-client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function createTestClient(fetchImpl: jest.MockedFunction<typeof fetch>) {
  return createCreemClient({
    apiKey: "creem_test_secret-key",
    environment: "test_mode",
    fetchImpl,
  });
}

const productWire = {
  id: "prod_123",
  mode: "test",
  object: "product",
  name: "Plus Monthly",
  description: "Plus plan",
  price: 999,
  currency: "USD",
  billing_type: "recurring",
  billing_period: "every-month",
  status: "active",
  tax_mode: "exclusive",
  tax_category: "saas",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  product_url: "",
  default_success_url: "",
};

describe("Creem REST client", () => {
  it("uses the test API and maps checkout fields at the boundary", async () => {
    const fetchImpl = jest.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        id: "ch_123",
        status: "pending",
        checkout_url: "https://checkout.creem.io/ch_123",
        metadata: { userId: "user_123" },
      }),
    );
    const client = createTestClient(fetchImpl);

    await expect(
      client.checkouts.create({
        productId: "prod_123",
        requestId: "req_123",
        successUrl: "https://example.com/success",
        customer: { email: "user@example.com" },
        metadata: { userId: "user_123" },
      }),
    ).resolves.toEqual({
      id: "ch_123",
      status: "pending",
      checkoutUrl: "https://checkout.creem.io/ch_123",
      metadata: { userId: "user_123" },
    });

    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("https://test-api.creem.io/v1/checkouts");
    expect(init?.headers).toMatchObject({
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": "creem_test_secret-key",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      product_id: "prod_123",
      request_id: "req_123",
      success_url: "https://example.com/success",
      customer: { email: "user@example.com" },
      metadata: { userId: "user_123" },
    });
  });

  it("uses the production API and URL-encodes checkout identifiers", async () => {
    const fetchImpl = jest
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ status: "completed" }));
    const client = createCreemClient({
      apiKey: "creem_live-key",
      environment: "live_mode",
      fetchImpl,
    });

    await client.checkouts.retrieve("ch_1 & 2");

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.creem.io/v1/checkouts?checkout_id=ch_1+%26+2",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("maps the customer portal response", async () => {
    const fetchImpl = jest.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        customer_portal_link: "https://creem.io/portal/cust_123",
      }),
    );

    await expect(
      createTestClient(fetchImpl).customers.generateBillingLinks({
        customerId: "cust_123",
      }),
    ).resolves.toEqual({
      customerPortalLink: "https://creem.io/portal/cust_123",
    });

    expect(JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body))).toEqual({
      customer_id: "cust_123",
    });
  });

  it("sends the complete subscription cancellation contract", async () => {
    const fetchImpl = jest
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ id: "sub_123", status: "canceled" }));

    await createTestClient(fetchImpl).subscriptions.cancel("sub/123", {
      mode: "immediate",
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "https://test-api.creem.io/v1/subscriptions/sub%2F123/cancel",
    );
    expect(JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body))).toEqual({
      mode: "immediate",
      onExecute: "cancel",
    });
  });

  it("maps paginated products and serializes product creation", async () => {
    const fetchImpl = jest
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          items: [productWire],
          pagination: {
            total_records: 1,
            total_pages: 1,
            current_page: 1,
            next_page: null,
            prev_page: null,
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(productWire));
    const client = createTestClient(fetchImpl);

    await expect(client.products.search(1, 100)).resolves.toMatchObject({
      items: [
        {
          id: "prod_123",
          billingType: "recurring",
          billingPeriod: "every-month",
          createdAt: "2026-01-01T00:00:00Z",
          productUrl: undefined,
          defaultSuccessUrl: undefined,
        },
      ],
      pagination: { totalRecords: 1, nextPage: null },
    });

    const input: CreateCreemProductInput = {
      name: "Plus Monthly",
      description: "Plus plan",
      price: 999,
      currency: "USD",
      billingType: "recurring",
      billingPeriod: "every-month",
      taxMode: "exclusive",
      taxCategory: "saas",
      idempotencyKey: "product-sync-test-plus-monthly",
    };
    await client.products.create(input);

    expect(fetchImpl.mock.calls[1]?.[1]?.headers).toMatchObject({
      "Idempotency-Key": "product-sync-test-plus-monthly",
    });
    expect(JSON.parse(String(fetchImpl.mock.calls[1]?.[1]?.body))).toEqual({
      name: "Plus Monthly",
      description: "Plus plan",
      price: 999,
      currency: "USD",
      billing_type: "recurring",
      billing_period: "every-month",
      tax_mode: "exclusive",
      tax_category: "saas",
    });
  });

  it("returns controlled errors without exposing provider response bodies", async () => {
    const fetchImpl = jest
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ error: "sensitive detail" }, 401));

    const result = createTestClient(fetchImpl).checkouts.retrieve("ch_123");

    await expect(result).rejects.toMatchObject({
      name: "CreemApiError",
      operation: "retrieve checkout",
      status: 401,
      message: "Creem request failed (retrieve checkout, HTTP 401).",
    });
    await expect(result).rejects.not.toThrow("sensitive detail");
  });

  it("rejects malformed success responses", async () => {
    const fetchImpl = jest
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ status: 123 }));

    await expect(
      createTestClient(fetchImpl).checkouts.retrieve("ch_123"),
    ).rejects.toEqual(
      expect.objectContaining<Partial<CreemApiError>>({
        name: "CreemApiError",
        message: "Creem returned an invalid response (retrieve checkout).",
      }),
    );
  });

  it("aborts requests at the configured timeout", async () => {
    jest.useFakeTimers();
    const fetchImpl = jest.fn<typeof fetch>((_url, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
      });
    });
    const client = createCreemClient({
      apiKey: "creem_test_key",
      environment: "test_mode",
      timeoutMs: 25,
      fetchImpl,
    });

    const result = client.checkouts.retrieve("ch_123");
    const expectation = expect(result).rejects.toMatchObject({
      name: "CreemApiError",
      message: "Creem request timed out after 25ms (retrieve checkout).",
    });
    await jest.advanceTimersByTimeAsync(25);

    await expectation;
    jest.useRealTimers();
  });

  it("rejects API keys from the other Creem environment", () => {
    expect(() =>
      createCreemClient({
        apiKey: "creem_test_key",
        environment: "live_mode",
      }),
    ).toThrow("CREEM_API_KEY does not match CREEM_ENVIRONMENT=live_mode.");
    expect(() =>
      createCreemClient({
        apiKey: "creem_live_key",
        environment: "test_mode",
      }),
    ).toThrow("CREEM_API_KEY does not match CREEM_ENVIRONMENT=test_mode.");
  });
});
