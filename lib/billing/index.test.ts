import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { PaymentProvider } from "./provider";

// Mock the provider types
const mockCreemProvider: PaymentProvider = {
  createCheckoutSession: jest.fn() as jest.MockedFunction<PaymentProvider["createCheckoutSession"]>,
  createCustomerPortalUrl: jest.fn() as jest.MockedFunction<PaymentProvider["createCustomerPortalUrl"]>,
  handleWebhook: jest.fn() as jest.MockedFunction<PaymentProvider["handleWebhook"]>,
};

// Mock constants with different scenarios
const mockConstants = {
  PAYMENT_PROVIDER: "creem",
};

// Mock the constants
jest.mock("@/lib/config/constants", () => mockConstants);

// Mock the creem provider
jest.mock("./creem/provider", () => ({
  __esModule: true,
  default: mockCreemProvider,
}));

describe("Billing Index", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("Provider Selection", () => {
    it("should select creem provider when PAYMENT_PROVIDER is creem", async () => {
      mockConstants.PAYMENT_PROVIDER = "creem";
      
      const { billing } = await import("./index");

      expect(billing).toBe(mockCreemProvider);
      expect(typeof billing.createCheckoutSession).toBe("function");
      expect(typeof billing.createCustomerPortalUrl).toBe("function");
      expect(typeof billing.handleWebhook).toBe("function");
    });

    it("should throw error for unsupported payment provider", async () => {
      (mockConstants as { PAYMENT_PROVIDER: string }).PAYMENT_PROVIDER = "unsupported";

      await expect(async () => {
        await import("./index");
      }).rejects.toThrow("Unsupported payment provider: unsupported");
    });

    it("should throw error for stripe provider (not yet implemented)", async () => {
      (mockConstants as { PAYMENT_PROVIDER: string }).PAYMENT_PROVIDER = "stripe";

      await expect(async () => {
        await import("./index");
      }).rejects.toThrow("Unsupported payment provider: stripe");
    });

    it("should throw error for empty payment provider", async () => {
      (mockConstants as { PAYMENT_PROVIDER: string }).PAYMENT_PROVIDER = "";

      await expect(async () => {
        await import("./index");
      }).rejects.toThrow("Unsupported payment provider: ");
    });

    it("should throw error for null payment provider", async () => {
      (mockConstants as { PAYMENT_PROVIDER: string | null }).PAYMENT_PROVIDER = null;

      await expect(async () => {
        await import("./index");
      }).rejects.toThrow("Unsupported payment provider: null");
    });

    it("should throw error for undefined payment provider", async () => {
      (mockConstants as { PAYMENT_PROVIDER: string | undefined }).PAYMENT_PROVIDER = undefined;

      await expect(async () => {
        await import("./index");
      }).rejects.toThrow("Unsupported payment provider: undefined");
    });
  });

  describe("Provider Interface", () => {
    beforeEach(() => {
      mockConstants.PAYMENT_PROVIDER = "creem";
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
      (mockCreemProvider.createCheckoutSession as jest.MockedFunction<typeof mockCreemProvider.createCheckoutSession>).mockResolvedValue(expectedResult);

      const result = await billing.createCheckoutSession(mockOptions);

      expect(result).toEqual(expectedResult);
      expect(mockCreemProvider.createCheckoutSession).toHaveBeenCalledWith(mockOptions);
      expect(mockCreemProvider.createCheckoutSession).toHaveBeenCalledTimes(1);
    });

    it("should delegate createCustomerPortalUrl to provider", async () => {
      const { billing } = await import("./index");
      
      const customerId = "customer123";
      const expectedResult = { portalUrl: "https://portal.example.com" };
      (mockCreemProvider.createCustomerPortalUrl as jest.MockedFunction<typeof mockCreemProvider.createCustomerPortalUrl>).mockResolvedValue(expectedResult);

      const result = await billing.createCustomerPortalUrl(customerId);

      expect(result).toEqual(expectedResult);
      expect(mockCreemProvider.createCustomerPortalUrl).toHaveBeenCalledWith(customerId);
      expect(mockCreemProvider.createCustomerPortalUrl).toHaveBeenCalledTimes(1);
    });

    it("should delegate handleWebhook to provider", async () => {
      const { billing } = await import("./index");
      
      const payload = '{"test": "webhook"}';
      const signature = "signature123";
      const expectedResult = { received: true, message: "Success" };
      (mockCreemProvider.handleWebhook as jest.MockedFunction<typeof mockCreemProvider.handleWebhook>).mockResolvedValue(expectedResult);

      const result = await billing.handleWebhook(payload, signature);

      expect(result).toEqual(expectedResult);
      expect(mockCreemProvider.handleWebhook).toHaveBeenCalledWith(payload, signature);
      expect(mockCreemProvider.handleWebhook).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      mockConstants.PAYMENT_PROVIDER = "creem";
    });

    it("should propagate createCheckoutSession errors", async () => {
      const { billing } = await import("./index");
      
      const mockOptions = {
        userId: "user123",
        userEmail: "test@example.com",
        tierId: "tier123",
        paymentMode: "subscription" as const,
        successUrl: "https://example.com/success",
      };

      const error = new Error("Checkout failed");
      (mockCreemProvider.createCheckoutSession as jest.MockedFunction<typeof mockCreemProvider.createCheckoutSession>).mockRejectedValue(error);

      await expect(billing.createCheckoutSession(mockOptions)).rejects.toThrow("Checkout failed");
    });

    it("should propagate createCustomerPortalUrl errors", async () => {
      const { billing } = await import("./index");
      
      const error = new Error("Portal creation failed");
      (mockCreemProvider.createCustomerPortalUrl as jest.MockedFunction<typeof mockCreemProvider.createCustomerPortalUrl>).mockRejectedValue(error);

      await expect(billing.createCustomerPortalUrl("customer123")).rejects.toThrow("Portal creation failed");
    });

    it("should propagate handleWebhook errors", async () => {
      const { billing } = await import("./index");
      
      const error = new Error("Webhook processing failed");
      (mockCreemProvider.handleWebhook as jest.MockedFunction<typeof mockCreemProvider.handleWebhook>).mockRejectedValue(error);

      await expect(billing.handleWebhook("payload", "signature")).rejects.toThrow("Webhook processing failed");
    });
  });

  describe("Provider Isolation", () => {
    it("should maintain separation between different provider instances", async () => {
      mockConstants.PAYMENT_PROVIDER = "creem";
      
      const { billing: billing1 } = await import("./index");
      
      // Reset and import again
      jest.resetModules();
      mockConstants.PAYMENT_PROVIDER = "creem";
      
      const { billing: billing2 } = await import("./index");

      // Should be the same provider but different import
      expect(billing1).toBe(billing2);
      expect(billing1.createCheckoutSession).toBe(mockCreemProvider.createCheckoutSession);
      expect(billing2.createCheckoutSession).toBe(mockCreemProvider.createCheckoutSession);
    });
  });

  describe("Type Safety", () => {
    beforeEach(() => {
      mockConstants.PAYMENT_PROVIDER = "creem";
    });

    it("should maintain PaymentProvider interface contract", async () => {
      const { billing } = await import("./index");

      // Verify the billing object implements PaymentProvider interface
      expect(billing).toHaveProperty("createCheckoutSession");
      expect(billing).toHaveProperty("createCustomerPortalUrl");
      expect(billing).toHaveProperty("handleWebhook");

      // Verify method signatures match interface
      expect(typeof billing.createCheckoutSession).toBe("function");
      expect(typeof billing.createCustomerPortalUrl).toBe("function");
      expect(typeof billing.handleWebhook).toBe("function");
    });

    it("should handle valid payment modes", async () => {
      const { billing } = await import("./index");
      
      const subscriptionOptions = {
        userId: "user123",
        userEmail: "test@example.com",
        tierId: "tier123",
        paymentMode: "subscription" as const,
        successUrl: "https://example.com/success",
      };

      const oneTimeOptions = {
        userId: "user123",
        userEmail: "test@example.com",
        tierId: "tier123",
        paymentMode: "one_time" as const,
        successUrl: "https://example.com/success",
      };

      (mockCreemProvider.createCheckoutSession as jest.MockedFunction<typeof mockCreemProvider.createCheckoutSession>).mockResolvedValue({ checkoutUrl: "test" });

      await billing.createCheckoutSession(subscriptionOptions);
      await billing.createCheckoutSession(oneTimeOptions);

      expect(mockCreemProvider.createCheckoutSession).toHaveBeenCalledTimes(2);
      expect(mockCreemProvider.createCheckoutSession).toHaveBeenNthCalledWith(1, subscriptionOptions);
      expect(mockCreemProvider.createCheckoutSession).toHaveBeenNthCalledWith(2, oneTimeOptions);
    });

    it("should handle billing cycles for subscription mode", async () => {
      const { billing } = await import("./index");
      
      const monthlyOptions = {
        userId: "user123",
        userEmail: "test@example.com",
        tierId: "tier123",
        paymentMode: "subscription" as const,
        billingCycle: "monthly" as const,
        successUrl: "https://example.com/success",
      };

      const yearlyOptions = {
        userId: "user123",
        userEmail: "test@example.com",
        tierId: "tier123",
        paymentMode: "subscription" as const,
        billingCycle: "yearly" as const,
        successUrl: "https://example.com/success",
      };

      (mockCreemProvider.createCheckoutSession as jest.MockedFunction<typeof mockCreemProvider.createCheckoutSession>).mockResolvedValue({ checkoutUrl: "test" });

      await billing.createCheckoutSession(monthlyOptions);
      await billing.createCheckoutSession(yearlyOptions);

      expect(mockCreemProvider.createCheckoutSession).toHaveBeenCalledTimes(2);
      expect(mockCreemProvider.createCheckoutSession).toHaveBeenNthCalledWith(1, monthlyOptions);
      expect(mockCreemProvider.createCheckoutSession).toHaveBeenNthCalledWith(2, yearlyOptions);
    });
  });
});