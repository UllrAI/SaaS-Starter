import { z } from "zod";

const CREEM_API_ORIGINS = {
  live_mode: "https://api.creem.io",
  test_mode: "https://test-api.creem.io",
} as const;

const DEFAULT_TIMEOUT_MS = 10_000;

const metadataSchema = z.record(z.string(), z.unknown());

const checkoutWireSchema = z
  .object({
    id: z.string().optional(),
    status: z.string(),
    checkout_url: z.string().url().optional(),
    metadata: metadataSchema.optional(),
  })
  .passthrough();

const customerPortalWireSchema = z.object({
  customer_portal_link: z.string().url(),
});

const productWireSchema = z
  .object({
    id: z.string(),
    mode: z.string(),
    object: z.string(),
    name: z.string(),
    description: z.string().default(""),
    price: z.number().int().nonnegative(),
    currency: z.string(),
    billing_type: z.enum(["recurring", "onetime"]),
    billing_period: z.string().optional(),
    status: z.string(),
    tax_mode: z.string(),
    tax_category: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    product_url: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().url().optional(),
    ),
    default_success_url: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().url().nullable().optional(),
    ),
  })
  .passthrough();

const productListWireSchema = z.object({
  items: z.array(productWireSchema),
  pagination: z.object({
    total_records: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
    current_page: z.number().int().positive(),
    next_page: z.number().int().positive().nullable(),
    prev_page: z.number().int().positive().nullable(),
  }),
});

const subscriptionWireSchema = z
  .object({
    id: z.string(),
    status: z.string(),
  })
  .passthrough();

interface CreemCheckout {
  id?: string;
  status: string;
  checkoutUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface CreemProduct {
  id: string;
  mode: string;
  object: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingType: "recurring" | "onetime";
  billingPeriod?: string;
  status: string;
  taxMode: string;
  taxCategory: string;
  createdAt: string;
  updatedAt: string;
  productUrl?: string;
  defaultSuccessUrl?: string | null;
}

interface CreemProductList {
  items: CreemProduct[];
  pagination: {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    nextPage: number | null;
    previousPage: number | null;
  };
}

interface CreateCreemCheckoutInput {
  productId: string;
  requestId?: string;
  successUrl: string;
  customer?: {
    email: string;
  };
  metadata?: Record<string, unknown>;
}

interface CreemProductInputBase {
  name: string;
  description: string;
  price: number;
  currency: string;
  taxMode?: "inclusive" | "exclusive";
  taxCategory?: string;
  idempotencyKey?: string;
}

export type CreateCreemProductInput =
  | (CreemProductInputBase & {
      billingType: "recurring";
      billingPeriod: string;
    })
  | (CreemProductInputBase & {
      billingType: "onetime";
      billingPeriod?: never;
    });

export interface CreemClient {
  checkouts: {
    create(input: CreateCreemCheckoutInput): Promise<CreemCheckout>;
    retrieve(checkoutId: string): Promise<CreemCheckout>;
  };
  customers: {
    generateBillingLinks(input: {
      customerId: string;
    }): Promise<{ customerPortalLink: string }>;
  };
  subscriptions: {
    cancel(
      subscriptionId: string,
      input: {
        mode: "immediate" | "scheduled";
        onExecute?: "cancel" | "pause";
      },
    ): Promise<{ id: string; status: string }>;
  };
  products: {
    search(pageNumber?: number, pageSize?: number): Promise<CreemProductList>;
    create(input: CreateCreemProductInput): Promise<CreemProduct>;
  };
}

export class CreemApiError extends Error {
  constructor(
    message: string,
    readonly operation: string,
    readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "CreemApiError";
  }
}

interface CreateClientOptions {
  apiKey: string;
  environment: keyof typeof CREEM_API_ORIGINS;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export function createCreemClient({
  apiKey,
  environment,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = fetch,
}: CreateClientOptions): CreemClient {
  if (!apiKey.trim()) {
    throw new Error("CREEM_API_KEY environment variable is not set.");
  }
  const isTestKey = apiKey.startsWith("creem_test_");
  const hasCreemPrefix = apiKey.startsWith("creem_");
  if (
    (environment === "test_mode" && !isTestKey) ||
    (environment === "live_mode" && (!hasCreemPrefix || isTestKey))
  ) {
    throw new Error(
      `CREEM_API_KEY does not match CREEM_ENVIRONMENT=${environment}.`,
    );
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error("Creem request timeout must be a positive integer.");
  }

  const origin = CREEM_API_ORIGINS[environment];

  async function request(
    operation: string,
    path: string,
    init?: RequestInit,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(`${origin}${path}`, {
        ...init,
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "x-api-key": apiKey,
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...init?.headers,
        },
        redirect: "error",
        signal: controller.signal,
      });

      if (!response.ok) {
        await cancelResponseBody(response);
        throw new CreemApiError(
          `Creem request failed (${operation}, HTTP ${response.status}).`,
          operation,
          response.status,
        );
      }

      try {
        return await response.json();
      } catch (error) {
        throw new CreemApiError(
          `Creem returned an invalid JSON response (${operation}).`,
          operation,
          response.status,
          { cause: error },
        );
      }
    } catch (error) {
      if (error instanceof CreemApiError) {
        throw error;
      }
      if (controller.signal.aborted) {
        throw new CreemApiError(
          `Creem request timed out after ${timeoutMs}ms (${operation}).`,
          operation,
          undefined,
          { cause: error },
        );
      }
      throw new CreemApiError(
        `Creem request failed (${operation}).`,
        operation,
        undefined,
        { cause: error },
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async function requestAndParse<T>(
    operation: string,
    path: string,
    schema: z.ZodType<T>,
    init?: RequestInit,
  ): Promise<T> {
    const payload = await request(operation, path, init);
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new CreemApiError(
        `Creem returned an invalid response (${operation}).`,
        operation,
      );
    }
    return parsed.data;
  }

  return {
    checkouts: {
      async create(input) {
        const checkout = await requestAndParse(
          "create checkout",
          "/v1/checkouts",
          checkoutWireSchema,
          {
            method: "POST",
            body: JSON.stringify({
              product_id: input.productId,
              request_id: input.requestId,
              success_url: input.successUrl,
              customer: input.customer,
              metadata: input.metadata,
            }),
          },
        );
        return mapCheckout(checkout);
      },
      async retrieve(checkoutId) {
        const query = new URLSearchParams({ checkout_id: checkoutId });
        const checkout = await requestAndParse(
          "retrieve checkout",
          `/v1/checkouts?${query}`,
          checkoutWireSchema,
        );
        return mapCheckout(checkout);
      },
    },
    customers: {
      async generateBillingLinks({ customerId }) {
        const response = await requestAndParse(
          "create customer portal",
          "/v1/customers/billing",
          customerPortalWireSchema,
          {
            method: "POST",
            body: JSON.stringify({ customer_id: customerId }),
          },
        );
        return { customerPortalLink: response.customer_portal_link };
      },
    },
    subscriptions: {
      async cancel(subscriptionId, input) {
        const response = await requestAndParse(
          "cancel subscription",
          `/v1/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
          subscriptionWireSchema,
          {
            method: "POST",
            body: JSON.stringify({
              mode: input.mode,
              onExecute: input.onExecute ?? "cancel",
            }),
          },
        );
        return { id: response.id, status: response.status };
      },
    },
    products: {
      async search(pageNumber = 1, pageSize = 100) {
        const query = new URLSearchParams({
          page_number: String(pageNumber),
          page_size: String(pageSize),
        });
        const response = await requestAndParse(
          "list products",
          `/v1/products/search?${query}`,
          productListWireSchema,
        );
        return {
          items: response.items.map(mapProduct),
          pagination: {
            totalRecords: response.pagination.total_records,
            totalPages: response.pagination.total_pages,
            currentPage: response.pagination.current_page,
            nextPage: response.pagination.next_page,
            previousPage: response.pagination.prev_page,
          },
        };
      },
      async create(input) {
        const product = await requestAndParse(
          "create product",
          "/v1/products",
          productWireSchema,
          {
            method: "POST",
            headers: input.idempotencyKey
              ? { "Idempotency-Key": input.idempotencyKey }
              : undefined,
            body: JSON.stringify({
              name: input.name,
              description: input.description,
              price: input.price,
              currency: input.currency,
              billing_type: input.billingType,
              billing_period:
                input.billingType === "recurring"
                  ? input.billingPeriod
                  : undefined,
              tax_mode: input.taxMode,
              tax_category: input.taxCategory,
            }),
          },
        );
        return mapProduct(product);
      },
    },
  };
}

async function cancelResponseBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // The request error remains authoritative if the body is already locked.
  }
}

function mapCheckout(
  checkout: z.infer<typeof checkoutWireSchema>,
): CreemCheckout {
  return {
    id: checkout.id,
    status: checkout.status,
    checkoutUrl: checkout.checkout_url,
    metadata: checkout.metadata,
  };
}

function mapProduct(product: z.infer<typeof productWireSchema>): CreemProduct {
  return {
    id: product.id,
    mode: product.mode,
    object: product.object,
    name: product.name,
    description: product.description,
    price: product.price,
    currency: product.currency,
    billingType: product.billing_type,
    billingPeriod: product.billing_period,
    status: product.status,
    taxMode: product.tax_mode,
    taxCategory: product.tax_category,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    productUrl: product.product_url,
    defaultSuccessUrl: product.default_success_url,
  };
}
