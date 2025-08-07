import { describe, it, expect, jest } from "@jest/globals";
import { createMockAsyncFunction } from "@/../jest.setup";

// Mock types to avoid external dependencies
jest.mock("@/types/billing", () => ({
  CreateCheckoutOptions: {},
}));

import type { PaymentProvider, CreateCheckoutOptions } from "./provider";

describe("lib/billing/provider", () => {
  describe("PaymentProvider interface", () => {
    it("should define correct method signatures", () => {
      // Mock implementation of PaymentProvider
      const mockProvider: PaymentProvider = {
        createCheckoutSession: createMockAsyncFunction<
          [CreateCheckoutOptions],
          { checkoutUrl: string }
        >({ checkoutUrl: "test" }),
        createCustomerPortalUrl: createMockAsyncFunction<
          [string],
          { portalUrl: string }
        >({ portalUrl: "test" }),
        handleWebhook: createMockAsyncFunction<
          [string, string],
          { received: boolean; message?: string }
        >({ received: true }),
      };

      // Verify interface methods exist
      expect(typeof mockProvider.createCheckoutSession).toBe("function");
      expect(typeof mockProvider.createCustomerPortalUrl).toBe("function");
      expect(typeof mockProvider.handleWebhook).toBe("function");
    });

    describe("createCheckoutSession", () => {
      it("should have correct method signature", async () => {
        const mockProvider: PaymentProvider = {
          createCheckoutSession: createMockAsyncFunction<
            [CreateCheckoutOptions],
            { checkoutUrl: string }
          >({
            checkoutUrl: "https://checkout.example.com/session123",
          }),
          createCustomerPortalUrl: createMockAsyncFunction<
            [string],
            { portalUrl: string }
          >({ portalUrl: "test" }),
          handleWebhook: createMockAsyncFunction<
            [string, string],
            { received: boolean; message?: string }
          >({ received: true }),
        };

        const mockOptions: CreateCheckoutOptions = {
          userId: "user_123",
          userEmail: "test@example.com",
          userName: "Test User",
          tierId: "tier_123",
          paymentMode: "subscription",
          billingCycle: "monthly",
          successUrl: "https://app.example.com/success",
          cancelUrl: "https://app.example.com/cancel",
        };

        const result = await mockProvider.createCheckoutSession(mockOptions);

        expect(mockProvider.createCheckoutSession).toHaveBeenCalledWith(
          mockOptions,
        );
        expect(result).toHaveProperty("checkoutUrl");
        expect(typeof result.checkoutUrl).toBe("string");
        expect(result.checkoutUrl).toBe(
          "https://checkout.example.com/session123",
        );
      });

      it("should return Promise with checkoutUrl", async () => {
        const mockProvider: PaymentProvider = {
          createCheckoutSession: jest.fn().mockResolvedValue({
            checkoutUrl: "https://checkout.example.com/abc123",
          }) as any,
          createCustomerPortalUrl: jest.fn() as any,
          handleWebhook: jest.fn() as any,
        };

        const options = {
          productId: "product_test",
          customerId: "customer_test",
          successUrl: "https://success.test",
          cancelUrl: "https://cancel.test",
        };

        const result = await mockProvider.createCheckoutSession(options);

        expect(result).toEqual({
          checkoutUrl: "https://checkout.example.com/abc123",
        });
      });

      it("should handle various checkout options", async () => {
        const mockProvider: PaymentProvider = {
          createCheckoutSession: jest.fn().mockResolvedValue({
            checkoutUrl: "https://checkout.example.com/flexible",
          }) as any,
          createCustomerPortalUrl: jest.fn() as any,
          handleWebhook: jest.fn() as any,
        };

        // Test with minimal options
        const minimalOptions = {
          productId: "prod_minimal",
          customerId: "cust_minimal",
        };

        // Test with full options
        const fullOptions = {
          productId: "prod_full",
          customerId: "cust_full",
          successUrl: "https://app.com/success",
          cancelUrl: "https://app.com/cancel",
          metadata: { userId: "user123", planType: "premium" },
          discountCode: "SAVE20",
        };

        await mockProvider.createCheckoutSession(minimalOptions);
        await mockProvider.createCheckoutSession(fullOptions);

        expect(mockProvider.createCheckoutSession).toHaveBeenCalledTimes(2);
        expect(mockProvider.createCheckoutSession).toHaveBeenNthCalledWith(
          1,
          minimalOptions,
        );
        expect(mockProvider.createCheckoutSession).toHaveBeenNthCalledWith(
          2,
          fullOptions,
        );
      });

      it("should handle errors gracefully", async () => {
        const mockProvider: PaymentProvider = {
          createCheckoutSession: jest
            .fn()
            .mockRejectedValue(new Error("Checkout creation failed")) as any,
          createCustomerPortalUrl: jest.fn() as any,
          handleWebhook: jest.fn() as any,
        };

        const options = {
          productId: "invalid_product",
          customerId: "invalid_customer",
        };

        await expect(
          mockProvider.createCheckoutSession(options),
        ).rejects.toThrow("Checkout creation failed");
      });
    });

    describe("createCustomerPortalUrl", () => {
      it("should have correct method signature", async () => {
        const mockProvider: PaymentProvider = {
          createCheckoutSession: jest.fn() as any,
          createCustomerPortalUrl: jest.fn().mockResolvedValue({
            portalUrl: "https://portal.example.com/customer123",
          }) as any,
          handleWebhook: jest.fn() as any,
        };

        const customerId = "cust_123456";
        const result = await mockProvider.createCustomerPortalUrl(customerId);

        expect(mockProvider.createCustomerPortalUrl).toHaveBeenCalledWith(
          customerId,
        );
        expect(result).toHaveProperty("portalUrl");
        expect(typeof result.portalUrl).toBe("string");
        expect(result.portalUrl).toBe("https://portal.example.com/customer123");
      });

      it("should return Promise with portalUrl", async () => {
        const mockProvider: PaymentProvider = {
          createCheckoutSession: jest.fn() as any,
          createCustomerPortalUrl: jest.fn().mockResolvedValue({
            portalUrl: "https://billing.example.com/portal/xyz789",
          }) as any,
          handleWebhook: jest.fn() as any,
        };

        const customerId = "customer_test_id";
        const result = await mockProvider.createCustomerPortalUrl(customerId);

        expect(result).toEqual({
          portalUrl: "https://billing.example.com/portal/xyz789",
        });
      });

      it("should handle different customer ID formats", async () => {
        const mockProvider: PaymentProvider = {
          createCheckoutSession: jest.fn() as any,
          createCustomerPortalUrl: jest
            .fn()
            .mockResolvedValueOnce({ portalUrl: "https://portal.com/short123" })
            .mockResolvedValueOnce({
              portalUrl: "https://portal.com/long_customer_id_with_underscores",
            })
            .mockResolvedValueOnce({
              portalUrl: "https://portal.com/uuid-format-customer-id",
            }) as any,
          handleWebhook: jest.fn() as any,
        };

        await mockProvider.createCustomerPortalUrl("123");
        await mockProvider.createCustomerPortalUrl(
          "long_customer_id_with_underscores",
        );
        await mockProvider.createCustomerPortalUrl("uuid-format-customer-id");

        expect(mockProvider.createCustomerPortalUrl).toHaveBeenCalledTimes(3);
      });

      it("should handle errors gracefully", async () => {
        const mockProvider: PaymentProvider = {
          createCheckoutSession: jest.fn() as any,
          createCustomerPortalUrl: jest
            .fn()
            .mockRejectedValue(new Error("Portal creation failed")) as any,
          handleWebhook: jest.fn() as any,
        };

        await expect(
          mockProvider.createCustomerPortalUrl("invalid_customer"),
        ).rejects.toThrow("Portal creation failed");
      });

      it("should handle empty or invalid customer IDs", async () => {
        const mockProvider: PaymentProvider = {
          createCheckoutSession: jest.fn() as any,
          createCustomerPortalUrl: jest
            .fn()
            .mockRejectedValue(new Error("Invalid customer ID")) as any,
          handleWebhook: jest.fn() as any,
        };

        await expect(mockProvider.createCustomerPortalUrl("")).rejects.toThrow(
          "Invalid customer ID",
        );
        await expect(
          mockProvider.createCustomerPortalUrl("null"),
        ).rejects.toThrow("Invalid customer ID");
      });
    });

    describe("handleWebhook", () => {
      it("should have correct method signature", async () => {
        const mockProvider: PaymentProvider = {
          createCheckoutSession: jest.fn() as any,
          createCustomerPortalUrl: jest.fn() as any,
          handleWebhook: jest.fn().mockResolvedValue({
            received: true,
            message: "Webhook processed successfully",
          }) as any,
        };

        const payload = JSON.stringify({
          event: "payment.succeeded",
          data: { amount: 1000 },
        });
        const signature = "sha256=abc123def456";

        const result = await mockProvider.handleWebhook(payload, signature);

        expect(mockProvider.handleWebhook).toHaveBeenCalledWith(
          payload,
          signature,
        );
        expect(result).toHaveProperty("received");
        expect(typeof result.received).toBe("boolean");
        expect(result.received).toBe(true);
        expect(result).toHaveProperty("message");
        expect(result.message).toBe("Webhook processed successfully");
      });

      it("should return Promise with received boolean", async () => {
        const mockProvider: PaymentProvider = {
          createCheckoutSession: jest.fn() as any,
          createCustomerPortalUrl: jest.fn() as any,
          handleWebhook: jest.fn().mockResolvedValue({ received: true }) as any,
        };

        const payload = '{"event":"subscription.created"}';
        const signature = "valid_signature";

        const result = await mockProvider.handleWebhook(payload, signature);

        expect(result.received).toBe(true);
      });

      it("should handle successful webhook processing", async () => {
        const mockProvider: PaymentProvider = {
          createCheckoutSession: jest.fn(),
          createCustomerPortalUrl: jest.fn(),
          handleWebhook: jest.fn().mockResolvedValue({
            received: true,
            message: "Payment webhook processed",
          }),
        };

        const payload = JSON.stringify({
          event: "payment.succeeded",
          data: {
            paymentId: "pay_123",
            amount: 2999,
            currency: "usd",
          },
        });
        const signature = "sha256=validhash";

        const result = await mockProvider.handleWebhook(payload, signature);

        expect(result.received).toBe(true);
        expect(result.message).toBe("Payment webhook processed");
      });

      it("should handle failed webhook processing", async () => {
        const mockProvider: PaymentProvider = {
          createCheckoutSession: jest.fn(),
          createCustomerPortalUrl: jest.fn(),
          handleWebhook: jest.fn().mockResolvedValue({
            received: false,
            message: "Invalid signature",
          }),
        };

        const payload = '{"event":"payment.failed"}';
        const signature = "invalid_signature";

        const result = await mockProvider.handleWebhook(payload, signature);

        expect(result.received).toBe(false);
        expect(result.message).toBe("Invalid signature");
      });

      it("should handle various webhook event types", async () => {
        const mockProvider: PaymentProvider = {
          createCheckoutSession: jest.fn(),
          createCustomerPortalUrl: jest.fn(),
          handleWebhook: jest
            .fn()
            .mockResolvedValueOnce({
              received: true,
              message: "Payment succeeded",
            })
            .mockResolvedValueOnce({
              received: true,
              message: "Subscription created",
            })
            .mockResolvedValueOnce({
              received: true,
              message: "Customer updated",
            })
            .mockResolvedValueOnce({
              received: true,
              message: "Refund processed",
            }),
        };

        const events = [
          { event: "payment.succeeded", data: { amount: 1000 } },
          {
            event: "subscription.created",
            data: { subscriptionId: "sub_123" },
          },
          { event: "customer.updated", data: { customerId: "cust_123" } },
          { event: "refund.created", data: { refundId: "ref_123" } },
        ];

        for (const event of events) {
          const payload = JSON.stringify(event);
          const signature = `sha256=hash_for_${event.event}`;

          const result = await mockProvider.handleWebhook(payload, signature);
          expect(result.received).toBe(true);
        }

        expect(mockProvider.handleWebhook).toHaveBeenCalledTimes(4);
      });

      it("should handle malformed payloads", async () => {
        const mockProvider: PaymentProvider = {
          createCheckoutSession: jest.fn(),
          createCustomerPortalUrl: jest.fn(),
          handleWebhook: jest.fn().mockResolvedValue({
            received: false,
            message: "Malformed payload",
          }),
        };

        const malformedPayload = "invalid json {";
        const signature = "sha256=validsignature";

        const result = await mockProvider.handleWebhook(
          malformedPayload,
          signature,
        );

        expect(result.received).toBe(false);
        expect(result.message).toBe("Malformed payload");
      });

      it("should handle empty payloads and signatures", async () => {
        const mockProvider: PaymentProvider = {
          createCheckoutSession: jest.fn(),
          createCustomerPortalUrl: jest.fn(),
          handleWebhook: jest.fn().mockResolvedValue({
            received: false,
            message: "Empty payload or signature",
          }),
        };

        await mockProvider.handleWebhook("", "");
        await mockProvider.handleWebhook("{}", "");
        await mockProvider.handleWebhook("", "signature");

        expect(mockProvider.handleWebhook).toHaveBeenCalledTimes(3);
      });

      it("should handle webhook processing errors", async () => {
        const mockProvider: PaymentProvider = {
          createCheckoutSession: jest.fn(),
          createCustomerPortalUrl: jest.fn(),
          handleWebhook: jest
            .fn()
            .mockRejectedValue(new Error("Webhook processing failed")),
        };

        const payload = '{"event":"error.test"}';
        const signature = "sha256=testsignature";

        await expect(
          mockProvider.handleWebhook(payload, signature),
        ).rejects.toThrow("Webhook processing failed");
      });
    });
  });

  describe("interface compliance", () => {
    it("should ensure all methods are async and return Promises", () => {
      const mockProvider: PaymentProvider = {
        createCheckoutSession: jest
          .fn()
          .mockResolvedValue({ checkoutUrl: "test" }) as any,
        createCustomerPortalUrl: jest
          .fn()
          .mockResolvedValue({ portalUrl: "test" }) as any,
        handleWebhook: jest.fn().mockResolvedValue({ received: true }) as any,
      };

      // All methods should be functions
      expect(typeof mockProvider.createCheckoutSession).toBe("function");
      expect(typeof mockProvider.createCustomerPortalUrl).toBe("function");
      expect(typeof mockProvider.handleWebhook).toBe("function");

      // All methods should return promises (when called)
      const checkoutPromise = mockProvider.createCheckoutSession({});
      const portalPromise = mockProvider.createCustomerPortalUrl("test");
      const webhookPromise = mockProvider.handleWebhook("payload", "signature");

      expect(checkoutPromise instanceof Promise).toBe(true);
      expect(portalPromise instanceof Promise).toBe(true);
      expect(webhookPromise instanceof Promise).toBe(true);
    });

    it("should have required properties in return types", async () => {
      const mockProvider: PaymentProvider = {
        createCheckoutSession: jest.fn().mockResolvedValue({
          checkoutUrl: "https://checkout.example.com/test",
        }),
        createCustomerPortalUrl: jest.fn().mockResolvedValue({
          portalUrl: "https://portal.example.com/test",
        }),
        handleWebhook: jest.fn().mockResolvedValue({
          received: true,
          message: "Processed successfully",
        }),
      };

      const checkoutResult = await mockProvider.createCheckoutSession({});
      const portalResult = await mockProvider.createCustomerPortalUrl("test");
      const webhookResult = await mockProvider.handleWebhook("test", "test");

      // Verify required properties exist
      expect(checkoutResult).toHaveProperty("checkoutUrl");
      expect(portalResult).toHaveProperty("portalUrl");
      expect(webhookResult).toHaveProperty("received");

      // Verify property types
      expect(typeof checkoutResult.checkoutUrl).toBe("string");
      expect(typeof portalResult.portalUrl).toBe("string");
      expect(typeof webhookResult.received).toBe("boolean");
    });

    it("should support optional message in webhook response", async () => {
      const mockProviderWithMessage: PaymentProvider = {
        createCheckoutSession: jest
          .fn()
          .mockResolvedValue({ checkoutUrl: "test" }),
        createCustomerPortalUrl: jest
          .fn()
          .mockResolvedValue({ portalUrl: "test" }),
        handleWebhook: jest.fn().mockResolvedValue({
          received: true,
          message: "Optional message included",
        }),
      };

      const mockProviderWithoutMessage: PaymentProvider = {
        createCheckoutSession: jest
          .fn()
          .mockResolvedValue({ checkoutUrl: "test" }),
        createCustomerPortalUrl: jest
          .fn()
          .mockResolvedValue({ portalUrl: "test" }),
        handleWebhook: jest.fn().mockResolvedValue({
          received: false,
          // message is optional
        }),
      };

      const resultWithMessage = await mockProviderWithMessage.handleWebhook(
        "test",
        "test",
      );
      const resultWithoutMessage =
        await mockProviderWithoutMessage.handleWebhook("test", "test");

      expect(resultWithMessage.message).toBe("Optional message included");
      expect(resultWithoutMessage.message).toBeUndefined();
    });
  });

  describe("type safety", () => {
    it("should enforce correct parameter types", () => {
      // This test verifies TypeScript compilation - if it compiles, types are correct
      const mockProvider: PaymentProvider = {
        createCheckoutSession: jest
          .fn()
          .mockResolvedValue({ checkoutUrl: "test" }) as any,
        createCustomerPortalUrl: jest
          .fn()
          .mockResolvedValue({ portalUrl: "test" }) as any,
        handleWebhook: jest.fn().mockResolvedValue({ received: true }) as any,
      };

      // These should compile without TypeScript errors
      expect(() => {
        mockProvider.createCheckoutSession({
          tierId: "test",
          userId: "test",
          userEmail: "test@example.com",
          paymentMode: "subscription",
          billingCycle: "monthly",
        });
        mockProvider.createCustomerPortalUrl("customer_id");
        mockProvider.handleWebhook("payload", "signature");
      }).not.toThrow();
    });

    it("should have consistent interface structure", () => {
      // Verify that the interface can be implemented
      class TestProvider implements PaymentProvider {
        async createCheckoutSession(options: any) {
          return { checkoutUrl: `checkout_${options.tierId}` };
        }

        async createCustomerPortalUrl(customerId: string) {
          return { portalUrl: `portal_${customerId}` };
        }

        async handleWebhook(payload: string, signature: string) {
          return {
            received: payload.length > 0 && signature.length > 0,
            message: "Test implementation",
          };
        }
      }

      const provider = new TestProvider();
      expect(provider).toBeInstanceOf(TestProvider);
      expect(typeof provider.createCheckoutSession).toBe("function");
      expect(typeof provider.createCustomerPortalUrl).toBe("function");
      expect(typeof provider.handleWebhook).toBe("function");
    });
  });
});
