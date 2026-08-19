import type { CreateCheckoutOptions, PaymentMode } from "@/types/billing";

export type CheckoutStatus = "success" | "failed" | "pending" | "cancelled";

export interface CheckoutStatusResult {
  status: CheckoutStatus;
  ownerId: string | null;
  paymentMode: PaymentMode | null;
}

export interface PaymentProvider {
  /**
   * Create a provider-side customer for a user. Must be idempotent per user so
   * concurrent first checkouts cannot strand payments on a second customer.
   */
  createCustomer(options: {
    userId: string;
    email: string;
    name?: string | null;
  }): Promise<{ customerId: string }>;
  createCheckoutSession(
    options: CreateCheckoutOptions,
  ): Promise<{ checkoutUrl: string }>;
  createCustomerPortalUrl(customerId: string): Promise<{ portalUrl: string }>;
  getCheckoutStatus(checkoutId: string): Promise<CheckoutStatusResult>;
  cancelSubscription(
    subscriptionId: string,
    options: { mode: "immediate" | "scheduled" },
  ): Promise<void>;

  /**
   * @param payload - The raw request body as a string.
   * @param signature - The provider webhook signature.
   */
  handleWebhook(
    payload: string,
    signature: string,
  ): Promise<{ received: true }>;
}
