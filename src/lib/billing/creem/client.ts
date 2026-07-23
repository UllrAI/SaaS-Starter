import { Creem } from "creem";
import env from "@/env";

if (!env.CREEM_API_KEY) {
  throw new Error("CREEM_API_KEY environment variable is not set.");
}

export const creemApiKey = env.CREEM_API_KEY;

export const creemClient = new Creem({
  server: env.CREEM_ENVIRONMENT === "live_mode" ? "prod" : "test",
  apiKey: creemApiKey,
});

export const creemWebhookSecret = env.CREEM_WEBHOOK_SECRET;
