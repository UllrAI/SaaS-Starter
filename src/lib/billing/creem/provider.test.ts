import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { z } from "zod";

// Mock environment first
jest.mock("@/env", () => ({
  __esModule: true,
  default: {
    CREEM_API_KEY: "test_api_key",
    CREEM_WEBHOOK_SECRET: "test_webhook_secret",
    CREEM_ENVIRONMENT: "test_mode",
  },
}));

// Mock all dependencies before importing anything
const mockCreemClient = {
  createCheckout: jest.fn(),
  generateCustomerLinks: jest.fn(),
};

const mockGetProductTierById = jest.fn();
const mockHandleCreemWebhook = jest.fn();

// Mock fetch and related HTTP APIs comprehensively
const mockResponse = {
  ok: true,
  status: 200,
  statusText: "OK",
  headers: new Map(),
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(""),
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  blob: jest.fn().mockResolvedValue(new Blob()),
  clone: jest.fn().mockReturnThis(),
} as any;

global.fetch = jest.fn().mockResolvedValue(mockResponse) as any;
global.Request = jest.fn().mockImplementation((url, options) => ({
  url,
  method: "GET",
  headers: new Map(),
  ...options,
  clone: jest.fn().mockReturnThis(),
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(""),
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
})) as any;
global.Response = jest.fn().mockImplementation(() => mockResponse) as any;
global.Headers = jest.fn().mockImplementation(() => new Map()) as any;

// Mock any potential HTTP clients that Creem might use internally
// (removed axios and node-fetch as they are not used in actual code)

// Mock the Creem SDK completely - this must come before importing any modules that use it
jest.mock("creem", () => {
  const MockCreem = jest.fn().mockImplementation(() => mockCreemClient);
  return {
    Creem: MockCreem,
    __esModule: true,
    default: MockCreem,
  };
});

// Mock the client module to return our mock client
jest.mock("./client", () => ({
  __esModule: true,
  creemClient: mockCreemClient,
  creemApiKey: "test_api_key",
  creemWebhookSecret: "test_webhook_secret",
}));

jest.mock("@/lib/config/products", () => ({
  __esModule: true,
  getProductTierById: mockGetProductTierById,
}));

jest.mock("./webhook", () => ({
  __esModule: true,
  handleCreemWebhook: mockHandleCreemWebhook,
}));

// Import types first
import type { CreateCheckoutOptions } from "@/types/billing";

// Import types and interfaces
import type { PaymentProvider } from "../provider";

// Define variable to hold the provider
let creemProvider: PaymentProvider;

// Test the Zod schemas directly
const CreemCheckoutResponseSchema = z.object({
  checkoutUrl: z.string().url(),
});

const CreemCustomerPortalResponseSchema = z.object({
  customerPortalLink: z.string().url(),
});

describe("Creem Provider Zod Validation", () => {
  describe("CreemCheckoutResponseSchema", () => {
    it("should validate valid checkout response", () => {
      const validResponse = {
        checkoutUrl: "https://checkout.creem.io/session-123",
      };

      const result = CreemCheckoutResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.checkoutUrl).toBe(
          "https://checkout.creem.io/session-123",
        );
      }
    });

    it("should reject invalid URL format", () => {
      const invalidResponse = {
        checkoutUrl: "invalid-url",
      };

      const result = CreemCheckoutResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("should reject missing checkoutUrl", () => {
      const invalidResponse = {};

      const result = CreemCheckoutResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("should reject null checkoutUrl", () => {
      const invalidResponse = {
        checkoutUrl: null,
      };

      const result = CreemCheckoutResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe("CreemCustomerPortalResponseSchema", () => {
    it("should validate valid customer portal response", () => {
      const validResponse = {
        customerPortalLink: "https://portal.creem.io/customer-123",
      };

      const result = CreemCustomerPortalResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customerPortalLink).toBe(
          "https://portal.creem.io/customer-123",
        );
      }
    });

    it("should reject invalid URL format", () => {
      const invalidResponse = {
        customerPortalLink: "invalid-url",
      };

      const result =
        CreemCustomerPortalResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("should reject missing customerPortalLink", () => {
      const invalidResponse = {};

      const result =
        CreemCustomerPortalResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("should reject null customerPortalLink", () => {
      const invalidResponse = {
        customerPortalLink: null,
      };

      const result =
        CreemCustomerPortalResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe("Error handling patterns", () => {
    it("should demonstrate safe parsing pattern for checkout", () => {
      const mockApiResponse = { someOtherField: "value" };

      const parsed = CreemCheckoutResponseSchema.safeParse(mockApiResponse);

      if (!parsed.success) {
        // This is the pattern we implemented in the provider
        const errorMessage = `Failed to parse checkout response from Creem. API Response: ${JSON.stringify(mockApiResponse)}`;
        expect(errorMessage).toContain("Failed to parse checkout response");
        expect(parsed.error).toBeDefined();
      }
    });

    it("should demonstrate safe parsing pattern for customer portal", () => {
      const mockApiResponse = { someOtherField: "value" };

      const parsed =
        CreemCustomerPortalResponseSchema.safeParse(mockApiResponse);

      if (!parsed.success) {
        // This is the pattern we implemented in the provider
        const errorMessage = `Failed to parse customer portal response from Creem. API Response: ${JSON.stringify(mockApiResponse)}`;
        expect(errorMessage).toContain(
          "Failed to parse customer portal response",
        );
        expect(parsed.error).toBeDefined();
      }
    });
  });
});

describe("Creem Provider Implementation", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Mock console.error to suppress expected error logs during tests
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    // Re-import the provider to ensure fresh mocks
    creemProvider = (await import("./provider")).default;
  });

  afterEach(() => {
    // Restore console.error after each test
    consoleErrorSpy.mockRestore();
  });

  describe("createCheckoutSession", () => {
    const mockCheckoutOptions: CreateCheckoutOptions = {
      tierId: "pro",
      userId: "user123",
      userEmail: "user@example.com",
      userName: "John Doe",
      paymentMode: "subscription",
      billingCycle: "monthly",
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
      failureUrl: "https://example.com/failure",
    };

    it("should create checkout session successfully", async () => {
      const mockTier = {
        id: "pro",
        name: "Professional",
        pricing: {
          creem: {
            oneTime: "prod_one_time",
            monthly: "prod_monthly",
            yearly: "prod_yearly",
          },
        },
      };

      const mockCheckoutResponse = {
        checkoutUrl: "https://checkout.creem.io/session-123",
      };

      mockGetProductTierById.mockReturnValue(mockTier);
      mockCreemClient.createCheckout.mockResolvedValue(mockCheckoutResponse);

      const result =
        await creemProvider.createCheckoutSession(mockCheckoutOptions);

      expect(mockGetProductTierById).toHaveBeenCalledWith("pro");
      expect(mockCreemClient.createCheckout).toHaveBeenCalledWith({
        xApiKey: "test_api_key",
        createCheckoutRequest: {
          productId: "prod_monthly",
          successUrl: "https://example.com/success",
          customer: {
            email: "user@example.com",
            name: "John Doe",
          },
          metadata: {
            userId: "user123",
            tierId: "pro",
            paymentMode: "subscription",
            billingCycle: "monthly",
            cancelUrl: "https://example.com/cancel",
            failureUrl: "https://example.com/failure",
          },
        },
      });
      expect(result).toEqual({
        checkoutUrl: "https://checkout.creem.io/session-123",
      });
    });

    it("should handle yearly billing cycle", async () => {
      const mockTier = {
        id: "pro",
        pricing: {
          creem: {
            oneTime: "prod_one_time",
            monthly: "prod_monthly",
            yearly: "prod_yearly",
          },
        },
      };

      const yearlyOptions = {
        ...mockCheckoutOptions,
        billingCycle: "yearly" as const,
      };

      mockGetProductTierById.mockReturnValue(mockTier);
      mockCreemClient.createCheckout.mockResolvedValue({
        checkoutUrl: "https://checkout.creem.io/session-yearly",
      });

      await creemProvider.createCheckoutSession(yearlyOptions);

      expect(mockCreemClient.createCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          createCheckoutRequest: expect.objectContaining({
            productId: "prod_yearly",
          }),
        }),
      );
    });

    it("should handle one-time payment mode", async () => {
      const mockTier = {
        id: "pro",
        pricing: {
          creem: {
            oneTime: "prod_one_time",
            monthly: "prod_monthly",
            yearly: "prod_yearly",
          },
        },
      };

      const oneTimeOptions = {
        ...mockCheckoutOptions,
        paymentMode: "one_time" as const,
      };

      mockGetProductTierById.mockReturnValue(mockTier);
      mockCreemClient.createCheckout.mockResolvedValue({
        checkoutUrl: "https://checkout.creem.io/session-onetime",
      });

      await creemProvider.createCheckoutSession(oneTimeOptions);

      expect(mockCreemClient.createCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          createCheckoutRequest: expect.objectContaining({
            productId: "prod_one_time",
          }),
        }),
      );
    });

    it("should handle optional user name", async () => {
      const mockTier = {
        id: "pro",
        pricing: {
          creem: {
            oneTime: "prod_one_time",
            monthly: "prod_monthly",
            yearly: "prod_yearly",
          },
        },
      };

      const optionsWithoutName = {
        ...mockCheckoutOptions,
        userName: undefined,
      };

      mockGetProductTierById.mockReturnValue(mockTier);
      mockCreemClient.createCheckout.mockResolvedValue({
        checkoutUrl: "https://checkout.creem.io/session-123",
      });

      await creemProvider.createCheckoutSession(optionsWithoutName);

      expect(mockCreemClient.createCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          createCheckoutRequest: expect.objectContaining({
            customer: {
              email: "user@example.com",
              name: undefined,
            },
          }),
        }),
      );
    });

    it("should throw error when tier not found", async () => {
      mockGetProductTierById.mockReturnValue(null);

      await expect(
        creemProvider.createCheckoutSession(mockCheckoutOptions),
      ).rejects.toThrow('Pricing tier with id "pro" not found.');

      expect(mockCreemClient.createCheckout).not.toHaveBeenCalled();
    });

    it("should throw error when product ID not found for payment mode", async () => {
      const mockTier = {
        id: "pro",
        pricing: {
          creem: {
            oneTime: "",
            monthly: "prod_monthly",
            yearly: "prod_yearly",
          },
        },
      };

      const oneTimeOptions = {
        ...mockCheckoutOptions,
        paymentMode: "one_time" as const,
      };

      mockGetProductTierById.mockReturnValue(mockTier);

      await expect(
        creemProvider.createCheckoutSession(oneTimeOptions),
      ).rejects.toThrow(
        'Creem product ID not found for tier "pro" with mode "one_time" and cycle "monthly".',
      );
    });

    it("should handle invalid Creem API response", async () => {
      const mockTier = {
        id: "pro",
        pricing: {
          creem: {
            oneTime: "prod_one_time",
            monthly: "prod_monthly",
            yearly: "prod_yearly",
          },
        },
      };

      const invalidApiResponse = {
        someOtherField: "value",
      };

      mockGetProductTierById.mockReturnValue(mockTier);
      mockCreemClient.createCheckout.mockResolvedValue(invalidApiResponse);

      await expect(
        creemProvider.createCheckoutSession(mockCheckoutOptions),
      ).rejects.toThrow("Failed to parse checkout response from Creem");
    });

    it("should handle Creem API errors", async () => {
      const mockTier = {
        id: "pro",
        pricing: {
          creem: {
            oneTime: "prod_one_time",
            monthly: "prod_monthly",
            yearly: "prod_yearly",
          },
        },
      };

      mockGetProductTierById.mockReturnValue(mockTier);
      mockCreemClient.createCheckout.mockRejectedValue(new Error("API Error"));

      await expect(
        creemProvider.createCheckoutSession(mockCheckoutOptions),
      ).rejects.toThrow("Failed to create checkout session: API Error");
    });
  });

  describe("createCustomerPortalUrl", () => {
    it("should create customer portal URL successfully", async () => {
      const mockPortalResponse = {
        customerPortalLink: "https://portal.creem.io/customer-123",
      };

      mockCreemClient.generateCustomerLinks.mockResolvedValue(
        mockPortalResponse,
      );

      const result =
        await creemProvider.createCustomerPortalUrl("customer-123");

      expect(mockCreemClient.generateCustomerLinks).toHaveBeenCalledWith({
        xApiKey: "test_api_key",
        createCustomerPortalLinkRequestEntity: {
          customerId: "customer-123",
        },
      });
      expect(result).toEqual({
        portalUrl: "https://portal.creem.io/customer-123",
      });
    });

    it("should handle invalid Creem portal API response", async () => {
      const invalidApiResponse = {
        someOtherField: "value",
      };

      mockCreemClient.generateCustomerLinks.mockResolvedValue(
        invalidApiResponse,
      );

      await expect(
        creemProvider.createCustomerPortalUrl("customer-123"),
      ).rejects.toThrow("Failed to parse customer portal response from Creem");
    });

    it("should handle Creem portal API errors", async () => {
      mockCreemClient.generateCustomerLinks.mockRejectedValue(
        new Error("Portal API Error"),
      );

      await expect(
        creemProvider.createCustomerPortalUrl("customer-123"),
      ).rejects.toThrow(
        "Failed to create customer portal session: Portal API Error",
      );
    });
  });

  describe("handleWebhook", () => {
    it("should handle webhook successfully", async () => {
      const mockWebhookResult = {
        received: true,
        message: "Webhook processed successfully",
      };

      mockHandleCreemWebhook.mockResolvedValue(mockWebhookResult);

      const result = await creemProvider.handleWebhook("payload", "signature");

      expect(mockHandleCreemWebhook).toHaveBeenCalledWith(
        "payload",
        "signature",
      );
      expect(result).toEqual(mockWebhookResult);
    });

    it("should handle webhook processing errors", async () => {
      mockHandleCreemWebhook.mockRejectedValue(
        new Error("Webhook processing failed"),
      );

      const result = await creemProvider.handleWebhook("payload", "signature");

      expect(result).toEqual({
        received: false,
        message: "Webhook processing failed",
      });
    });

    it("should handle webhook with no secret configured", async () => {
      // Create a new mock without the webhook secret
      jest.doMock("./client", () => ({
        __esModule: true,
        creemClient: mockCreemClient,
        creemApiKey: "test_api_key",
        creemWebhookSecret: undefined,
      }));

      // Clear the module cache and re-import
      jest.resetModules();
      const { default: providerWithoutSecret } = await import("./provider");

      const result = await providerWithoutSecret.handleWebhook(
        "payload",
        "signature",
      );

      expect(result).toEqual({
        received: false,
        message: "Webhook secret not configured.",
      });
    });

    it("should handle unknown webhook errors", async () => {
      // Restore the mock with secret to ensure webhook processing
      jest.doMock("./client", () => ({
        __esModule: true,
        creemClient: mockCreemClient,
        creemApiKey: "test_api_key",
        creemWebhookSecret: "test_webhook_secret",
      }));

      jest.resetModules();
      const { default: providerWithSecret } = await import("./provider");

      mockHandleCreemWebhook.mockRejectedValue("String error");

      const result = await providerWithSecret.handleWebhook(
        "payload",
        "signature",
      );

      expect(result).toEqual({
        received: false,
        message: "Webhook handling failed",
      });
    });
  });
});
