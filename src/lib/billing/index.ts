import { PAYMENT_PROVIDER } from "@/lib/config/constants";
import type { PaymentProvider } from "./provider";
import creemProvider from "./creem/provider";
// import stripeProvider from "./stripe/provider"; // 示例：未来可以添加

const BILLING_PROVIDERS: Record<string, PaymentProvider> = {
  creem: creemProvider,
  // stripe: stripeProvider,
};

const billingProvider = BILLING_PROVIDERS[PAYMENT_PROVIDER];
if (!billingProvider) {
  throw new Error(`Unsupported payment provider: ${PAYMENT_PROVIDER}`);
}

export const billing = billingProvider;
