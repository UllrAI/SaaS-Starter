import { PAYMENT_PROVIDER } from "@/lib/config/constants";
import type { PaymentProvider } from "./provider";
import stripeProvider from "./stripe/provider";

const BILLING_PROVIDERS: Record<string, PaymentProvider> = {
  stripe: stripeProvider,
};

const billingProvider = BILLING_PROVIDERS[PAYMENT_PROVIDER];
if (!billingProvider) {
  throw new Error(`Unsupported payment provider: ${PAYMENT_PROVIDER}`);
}

export const billing = billingProvider;
