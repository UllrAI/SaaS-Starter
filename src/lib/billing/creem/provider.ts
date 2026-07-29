import type {
  CheckoutStatus,
  CheckoutStatusResult,
  PaymentProvider,
} from "../provider";
import type { CreateCheckoutOptions } from "@/types/billing";
import { z } from "zod";
import { creemClient, creemEnvironment, creemWebhookSecret } from "./client";
import { handleCreemWebhook } from "./webhook";
import { getCreemProductIds } from "./products";

const CreemCheckoutResponseSchema = z.object({
  checkoutUrl: z.string().url(),
});

const CreemCustomerPortalResponseSchema = z.object({
  customerPortalLink: z.string().url(),
});

const CHECKOUT_STATUS_MAP: Record<string, CheckoutStatus> = {
  completed: "success",
  succeeded: "success",
  failed: "failed",
  expired: "failed",
  canceled: "cancelled",
  cancelled: "cancelled",
  pending: "pending",
  processing: "pending",
  open: "pending",
};

function resolveCheckoutStatus(status: string): CheckoutStatus {
  return CHECKOUT_STATUS_MAP[status.toLowerCase()] ?? "pending";
}

function mapCheckoutStatus(
  checkout: Awaited<ReturnType<typeof creemClient.checkouts.retrieve>>,
): CheckoutStatusResult {
  const ownerId = checkout.metadata?.userId;
  const paymentMode = checkout.metadata?.paymentMode;

  return {
    status: resolveCheckoutStatus(checkout.status),
    ownerId: typeof ownerId === "string" ? ownerId : null,
    paymentMode:
      paymentMode === "subscription" || paymentMode === "one_time"
        ? paymentMode
        : null,
  };
}

const creemProvider: PaymentProvider = {
  async createCheckoutSession(
    options: CreateCheckoutOptions,
  ): Promise<{ checkoutUrl: string }> {
    try {
      let creemProductId: string;
      const productIds = getCreemProductIds(options.tierId, creemEnvironment);
      if (!productIds) {
        throw new Error(`Pricing tier with id "${options.tierId}" not found.`);
      }
      if (options.paymentMode === "one_time") {
        creemProductId = productIds.oneTime;
      } else {
        creemProductId =
          options.billingCycle === "yearly"
            ? productIds.yearly
            : productIds.monthly;
      }

      if (!creemProductId) {
        throw new Error(
          `Creem product ID not found for tier "${options.tierId}" with mode "${options.paymentMode}" and cycle "${options.billingCycle}".`,
        );
      }

      const checkoutRequestData = {
        requestId: options.requestId,
        productId: creemProductId,
        successUrl: options.successUrl,
        customer: {
          email: options.userEmail,
        },
        metadata: {
          userId: options.userId,
          tierId: options.tierId,
          paymentMode: options.paymentMode,
          billingCycle: options.billingCycle ?? null,
        },
      };

      const response = await creemClient.checkouts.create(checkoutRequestData);

      const parsed = CreemCheckoutResponseSchema.safeParse(response);

      if (!parsed.success) {
        console.error("Invalid Creem checkout response:", parsed.error);
        throw new Error("Failed to parse checkout response from Creem.");
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
      const response = await creemClient.customers.generateBillingLinks({
        customerId,
      });

      const parsed = CreemCustomerPortalResponseSchema.safeParse(response);

      if (!parsed.success) {
        console.error("Invalid Creem customer portal response:", parsed.error);
        throw new Error("Failed to parse customer portal response from Creem.");
      }

      return { portalUrl: parsed.data.customerPortalLink };
    } catch (error) {
      console.error("Error creating Creem customer portal URL:", error);
      const message =
        error instanceof Error ? error.message : "An unknown error occurred.";
      throw new Error(`Failed to create customer portal session: ${message}`);
    }
  },

  async getCheckoutStatus(checkoutId: string): Promise<CheckoutStatusResult> {
    const checkout = await creemClient.checkouts.retrieve(checkoutId);
    return mapCheckoutStatus(checkout);
  },

  async cancelSubscription(
    subscriptionId: string,
    options: { mode: "immediate" | "scheduled" },
  ): Promise<void> {
    await creemClient.subscriptions.cancel(subscriptionId, options);
  },

  async handleWebhook(
    payload: string,
    signature: string,
  ): Promise<{ received: boolean; message?: string }> {
    if (!creemWebhookSecret) {
      console.error("Creem webhook secret is not configured.");
      throw new Error("Webhook secret not configured.");
    }

    try {
      return await handleCreemWebhook(payload, signature);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Webhook handling failed";
      console.error(`[Creem Webhook Provider Error]: ${message}`);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(message);
    }
  },
};

export default creemProvider;
