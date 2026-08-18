import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { PaymentProvider } from "./provider";

// Mock the provider types
const mockStripeProvider: PaymentProvider = {
  createCheckoutSession: jest.fn() as jest.MockedFunction<
    PaymentProvider["createCheckoutSession"]
  >,
  createCustomerPortalUrl: jest.fn() as jest.MockedFunction<
    PaymentProvider["createCustomerPortalUrl"]
  >,
  getCheckoutStatus: jest.fn() as jest.MockedFunction<
    PaymentProvider["getCheckoutStatus"]
  >,
  cancelSubscription: jest.fn() as jest.MockedFunction<
    PaymentProvider["cancelSubscription"]
  >,
  handleWebhook: jest.fn() as jest.MockedFunction<
    PaymentProvider["handleWebhook"]
  >,
};

// Mock constants with different scenarios
const mockConstants = {
  PAYMENT_PROVIDER: "stripe",
};

// Mock the constants
jest.mock("@/lib/config/constants", () => mockConstants);

// Mock the stripe provider
jest.mock("./stripe/provider", () => ({
  __esModule: true,
  default: mockStripeProvider,
}));

describe("Billing Index", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("Provider Selection", () => {
    it("should select stripe provider when PAYMENT_PROVIDER is stripe", async () => {
      mockConstants.PAYMENT_PROVIDER = "stripe";

      const { billing } = await import("./index");

      expect(billing).toBe(mockStripeProvider);
      expect(typeof billing.createCheckoutSession).toBe("function");
      expect(typeof billing.createCustomerPortalUrl).toBe("function");
      expect(typeof billing.getCheckoutStatus).toBe("function");
      expect(typeof billing.cancelSubscription).toBe("function");
      expect(typeof billing.handleWebhook).toBe("function");
    });

    it("should throw error for unsupported payment provider", async () => {
      (mockConstants as { PAYMENT_PROVIDER: string }).PAYMENT_PROVIDER =
        "unsupported";

      await expect(async () => {
        await import("./index");
      }).rejects.toThrow("Unsupported payment provider: unsupported");
    });

    it("should throw error for empty payment provider", async () => {
      (mockConstants as { PAYMENT_PROVIDER: string }).PAYMENT_PROVIDER = "";

      await expect(async () => {
        await import("./index");
      }).rejects.toThrow("Unsupported payment provider: ");
    });

    it("should throw error for null payment provider", async () => {
      (mockConstants as { PAYMENT_PROVIDER: string | null }).PAYMENT_PROVIDER =
        null;

      await expect(async () => {
        await import("./index");
      }).rejects.toThrow("Unsupported payment provider: null");
    });

    it("should throw error for undefined payment provider", async () => {
      (
        mockConstants as { PAYMENT_PROVIDER: string | undefined }
      ).PAYMENT_PROVIDER = undefined;

      await expect(async () => {
        await import("./index");
      }).rejects.toThrow("Unsupported payment provider: undefined");
    });
  });

  describe("Provider Interface", () => {
    beforeEach(() => {
      mockConstants.PAYMENT_PROVIDER = "stripe";
    });

    it("should export billing object with all required methods", async () => {
      const { billing } = await import("./index");

      expect(billing).toBeDefined();
      expect(typeof billing.createCheckoutSession).toBe("function");
      expect(typeof billing.createCustomerPortalUrl).toBe("function");
      expect(typeof billing.handleWebhook).toBe("function");
    });

    it("should delegate createCheckoutSession to provider", async () => {
      const { billing } = await import("./index");

      const mockOptions = {
        requestId: "request-123",
        userId: "user123",
        userEmail: "test@example.com",
        userName: "Test User",
        tierId: "tier123",
        paymentMode: "subscription" as const,
        billingCycle: "monthly" as const,
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
        failureUrl: "https://example.com/failure",
      };

      const expectedResult = { checkoutUrl: "https://checkout.example.com" };
      (
        mockStripeProvider.createCheckoutSession as jest.MockedFunction<
          typeof mockStripeProvider.createCheckoutSession
        >
      ).mockResolvedValue(expectedResult);

      const result = await billing.createCheckoutSession(mockOptions);

      expect(result).toEqual(expectedResult);
      expect(mockStripeProvider.createCheckoutSession).toHaveBeenCalledWith(
        mockOptions,
      );
      expect(mockStripeProvider.createCheckoutSession).toHaveBeenCalledTimes(1);
    });

    it("should delegate createCustomerPortalUrl to provider", async () => {
      const { billing } = await import("./index");

      const customerId = "customer123";
      const expectedResult = { portalUrl: "https://portal.example.com" };
      (
        mockStripeProvider.createCustomerPortalUrl as jest.MockedFunction<
          typeof mockStripeProvider.createCustomerPortalUrl
        >
      ).mockResolvedValue(expectedResult);

      const result = await billing.createCustomerPortalUrl(customerId);

      expect(result).toEqual(expectedResult);
      expect(mockStripeProvider.createCustomerPortalUrl).toHaveBeenCalledWith(
        customerId,
      );
      expect(mockStripeProvider.createCustomerPortalUrl).toHaveBeenCalledTimes(
        1,
      );
    });

    it("should delegate handleWebhook to provider", async () => {
      const { billing } = await import("./index");

      const payload = '{"test": "webhook"}';
      const signature = "signature123";
      const expectedResult = { received: true } as const;
      (
        mockStripeProvider.handleWebhook as jest.MockedFunction<
          typeof mockStripeProvider.handleWebhook
        >
      ).mockResolvedValue(expectedResult);

      const result = await billing.handleWebhook(payload, signature);

      expect(result).toEqual(expectedResult);
      expect(mockStripeProvider.handleWebhook).toHaveBeenCalledWith(
        payload,
        signature,
      );
      expect(mockStripeProvider.handleWebhook).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      mockConstants.PAYMENT_PROVIDER = "stripe";
    });

    it("should propagate createCheckoutSession errors", async () => {
      const { billing } = await import("./index");

      const mockOptions = {
        requestId: "request-123",
        userId: "user123",
        userEmail: "test@example.com",
        tierId: "tier123",
        paymentMode: "subscription" as const,
        successUrl: "https://example.com/success",
      };

      const error = new Error("Checkout failed");
      (
        mockStripeProvider.createCheckoutSession as jest.MockedFunction<
          typeof mockStripeProvider.createCheckoutSession
        >
      ).mockRejectedValue(error);

      await expect(billing.createCheckoutSession(mockOptions)).rejects.toThrow(
        "Checkout failed",
      );
    });

    it("should propagate createCustomerPortalUrl errors", async () => {
      const { billing } = await import("./index");

      const error = new Error("Portal creation failed");
      (
        mockStripeProvider.createCustomerPortalUrl as jest.MockedFunction<
          typeof mockStripeProvider.createCustomerPortalUrl
        >
      ).mockRejectedValue(error);

      await expect(
        billing.createCustomerPortalUrl("customer123"),
      ).rejects.toThrow("Portal creation failed");
    });

    it("should propagate handleWebhook errors", async () => {
      const { billing } = await import("./index");

      const error = new Error("Webhook processing failed");
      (
        mockStripeProvider.handleWebhook as jest.MockedFunction<
          typeof mockStripeProvider.handleWebhook
        >
      ).mockRejectedValue(error);

      await expect(
        billing.handleWebhook("payload", "signature"),
      ).rejects.toThrow("Webhook processing failed");
    });
  });

  describe("Provider Isolation", () => {
    it("should maintain separation between different provider instances", async () => {
      mockConstants.PAYMENT_PROVIDER = "stripe";

      const { billing: billing1 } = await import("./index");

      // Reset and import again
      jest.resetModules();
      mockConstants.PAYMENT_PROVIDER = "stripe";

      const { billing: billing2 } = await import("./index");

      // Should be the same provider but different import
      expect(billing1).toBe(billing2);
      expect(billing1.createCheckoutSession).toBe(
        mockStripeProvider.createCheckoutSession,
      );
      expect(billing2.createCheckoutSession).toBe(
        mockStripeProvider.createCheckoutSession,
      );
    });
  });

  describe("Type Safety", () => {
    beforeEach(() => {
      mockConstants.PAYMENT_PROVIDER = "stripe";
    });

    it("should maintain PaymentProvider interface contract", async () => {
      const { billing } = await import("./index");

      // Verify the billing object implements PaymentProvider interface
      expect(billing).toHaveProperty("createCheckoutSession");
      expect(billing).toHaveProperty("createCustomerPortalUrl");
      expect(billing).toHaveProperty("getCheckoutStatus");
      expect(billing).toHaveProperty("cancelSubscription");
      expect(billing).toHaveProperty("handleWebhook");

      // Verify method signatures match interface
      expect(typeof billing.createCheckoutSession).toBe("function");
      expect(typeof billing.createCustomerPortalUrl).toBe("function");
      expect(typeof billing.getCheckoutStatus).toBe("function");
      expect(typeof billing.cancelSubscription).toBe("function");
      expect(typeof billing.handleWebhook).toBe("function");
    });

    it("should handle valid payment modes", async () => {
      const { billing } = await import("./index");

      const subscriptionOptions = {
        requestId: "subscription-request",
        userId: "user123",
        userEmail: "test@example.com",
        tierId: "tier123",
        paymentMode: "subscription" as const,
        successUrl: "https://example.com/success",
      };

      const oneTimeOptions = {
        requestId: "one-time-request",
        userId: "user123",
        userEmail: "test@example.com",
        tierId: "tier123",
        paymentMode: "one_time" as const,
        successUrl: "https://example.com/success",
      };

      (
        mockStripeProvider.createCheckoutSession as jest.MockedFunction<
          typeof mockStripeProvider.createCheckoutSession
        >
      ).mockResolvedValue({ checkoutUrl: "test" });

      await billing.createCheckoutSession(subscriptionOptions);
      await billing.createCheckoutSession(oneTimeOptions);

      expect(mockStripeProvider.createCheckoutSession).toHaveBeenCalledTimes(2);
      expect(mockStripeProvider.createCheckoutSession).toHaveBeenNthCalledWith(
        1,
        subscriptionOptions,
      );
      expect(mockStripeProvider.createCheckoutSession).toHaveBeenNthCalledWith(
        2,
        oneTimeOptions,
      );
    });

    it("should handle billing cycles for subscription mode", async () => {
      const { billing } = await import("./index");

      const monthlyOptions = {
        requestId: "monthly-request",
        userId: "user123",
        userEmail: "test@example.com",
        tierId: "tier123",
        paymentMode: "subscription" as const,
        billingCycle: "monthly" as const,
        successUrl: "https://example.com/success",
      };

      const yearlyOptions = {
        requestId: "yearly-request",
        userId: "user123",
        userEmail: "test@example.com",
        tierId: "tier123",
        paymentMode: "subscription" as const,
        billingCycle: "yearly" as const,
        successUrl: "https://example.com/success",
      };

      (
        mockStripeProvider.createCheckoutSession as jest.MockedFunction<
          typeof mockStripeProvider.createCheckoutSession
        >
      ).mockResolvedValue({ checkoutUrl: "test" });

      await billing.createCheckoutSession(monthlyOptions);
      await billing.createCheckoutSession(yearlyOptions);

      expect(mockStripeProvider.createCheckoutSession).toHaveBeenCalledTimes(2);
      expect(mockStripeProvider.createCheckoutSession).toHaveBeenNthCalledWith(
        1,
        monthlyOptions,
      );
      expect(mockStripeProvider.createCheckoutSession).toHaveBeenNthCalledWith(
        2,
        yearlyOptions,
      );
    });
  });
});
