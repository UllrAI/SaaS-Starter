import { Creem } from "creem";
import env from "@/env";

if (!env.CREEM_API_KEY) {
  throw new Error("CREEM_API_KEY environment variable is not set.");
}

export const creemApiKey = env.CREEM_API_KEY;

export const creemClient = new Creem({
  // Select the Creem server by environment: 0 is live_mode, 1 is test_mode.
  serverIdx: env.CREEM_ENVIRONMENT === "live_mode" ? 0 : 1,
  apiKey: creemApiKey,
});

export const creemWebhookSecret = env.CREEM_WEBHOOK_SECRET;
