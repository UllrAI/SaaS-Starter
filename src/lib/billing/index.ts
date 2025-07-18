import { PAYMENT_PROVIDER } from "@/lib/config/constants";
import type { PaymentProvider } from "./provider";
import creemProvider from "./creem/provider";
// import stripeProvider from "./stripe/provider"; // 示例：未来可以添加

let billingProvider: PaymentProvider;

switch (PAYMENT_PROVIDER) {
  case "creem":
    billingProvider = creemProvider;
    break;
  // case "stripe":
  //   billingProvider = stripeProvider;
  //   break;
  default:
    throw new Error(`Unsupported payment provider: ${PAYMENT_PROVIDER}`);
}

export const billing = billingProvider;
