import "server-only";

import Stripe from "stripe";

import { getBillingConfig } from "@/lib/config/integrations";

import { STRIPE_API_VERSION } from "./api-version";

let client: Stripe | undefined;

export function getStripeClient(): Stripe {
  if (!client) {
    client = new Stripe(getBillingConfig().apiKey, {
      apiVersion: STRIPE_API_VERSION,
      maxNetworkRetries: 2,
      timeout: 10_000,
      telemetry: false,
    });
  }

  return client;
}

export function getStripeEnvironment() {
  return getBillingConfig().environment;
}
