import type { PaymentProvider } from "../provider";
import type { CreateCheckoutOptions } from "@/types/billing";
import { z } from "zod";
import { creemClient, creemApiKey, creemWebhookSecret } from "./client";
import { getProductTierById } from "@/lib/config/products";
import { handleCreemWebhook } from "./webhook";

// Zod schemas for Creem API responses
const CreemCheckoutResponseSchema = z.object({
  checkoutUrl: z.string().url(),
});

const CreemCustomerPortalResponseSchema = z.object({
  customerPortalLink: z.string().url(),
});

const creemProvider: PaymentProvider = {
  async createCheckoutSession(
    options: CreateCheckoutOptions,
  ): Promise<{ checkoutUrl: string }> {
    try {
      const tier = getProductTierById(options.tierId);
      if (!tier) {
        throw new Error(`Pricing tier with id "${options.tierId}" not found.`);
      }

      let creemProductId: string;
      if (options.paymentMode === "one_time") {
        creemProductId = tier.pricing.creem.oneTime;
      } else {
        creemProductId =
          options.billingCycle === "yearly"
            ? tier.pricing.creem.yearly
            : tier.pricing.creem.monthly;
      }

      if (!creemProductId) {
        throw new Error(
          `Creem product ID not found for tier "${options.tierId}" with mode "${options.paymentMode}" and cycle "${options.billingCycle}".`,
        );
      }

      const checkoutRequestData = {
        productId: creemProductId,
        successUrl: options.successUrl,
        // Note: Creem may not support cancelUrl directly, but we include it in metadata
        // for potential future use or custom handling
        customer: {
          email: options.userEmail,
          name: options.userName ?? undefined,
        },
        metadata: {
          userId: options.userId,
          tierId: options.tierId,
          paymentMode: options.paymentMode,
          billingCycle: options.billingCycle ?? null,
          cancelUrl: options.cancelUrl ?? null,
          failureUrl: options.failureUrl ?? null,
        },
      };

      const response = await creemClient.createCheckout({
        xApiKey: creemApiKey,
        createCheckoutRequest: checkoutRequestData,
      });

      const parsed = CreemCheckoutResponseSchema.safeParse(response);

      if (!parsed.success) {
        console.error("Invalid Creem checkout response:", parsed.error);
        throw new Error(
          `Failed to parse checkout response from Creem. API Response: ${JSON.stringify(response)}`,
        );
      }

      return { checkoutUrl: parsed.data.checkoutUrl };
    } catch (error) {
      console.error("Error creating Creem checkout session:", error);
      const message =
        error instanceof Error ? error.message : "An unknown error occurred.";
      throw new Error(`Failed to create checkout session: ${message}`);
    }
  },

  async createCustomerPortalUrl(
    customerId: string,
  ): Promise<{ portalUrl: string }> {
    try {
      const response = await creemClient.generateCustomerLinks({
        xApiKey: creemApiKey,
        createCustomerPortalLinkRequestEntity: {
          customerId: customerId,
        },
      });

      const parsed = CreemCustomerPortalResponseSchema.safeParse(response);

      if (!parsed.success) {
        console.error("Invalid Creem customer portal response:", parsed.error);
        throw new Error(
          `Failed to parse customer portal response from Creem. API Response: ${JSON.stringify(response)}`,
        );
      }

      return { portalUrl: parsed.data.customerPortalLink };
    } catch (error) {
      console.error("Error creating Creem customer portal URL:", error);
      const message =
        error instanceof Error ? error.message : "An unknown error occurred.";
      throw new Error(`Failed to create customer portal session: ${message}`);
    }
  },

  async handleWebhook(
    payload: string,
    signature: string,
  ): Promise<{ received: boolean; message?: string }> {
    if (!creemWebhookSecret) {
      console.error("Creem webhook secret is not configured.");
      return { received: false, message: "Webhook secret not configured." };
    }

    try {
      return await handleCreemWebhook(payload, signature);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Webhook handling failed";
      console.error(`[Creem Webhook Provider Error]: ${message}`);
      return { received: false, message };
    }
  },
};

export default creemProvider;
