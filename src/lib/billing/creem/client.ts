import "server-only";

import env from "@/env";
import { createCreemClient } from "./api-client";

const creemApiKey = env.CREEM_API_KEY;
export const creemEnvironment = env.CREEM_ENVIRONMENT;
export const creemWebhookSecret = env.CREEM_WEBHOOK_SECRET;

export const creemClient = createCreemClient({
  apiKey: creemApiKey,
  environment: creemEnvironment,
});
