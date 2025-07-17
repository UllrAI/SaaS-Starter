import { Creem } from "creem";
import env from "@/env";

if (!env.CREEM_API_KEY) {
  throw new Error("CREEM_API_KEY environment variable is not set.");
}

export const creemClient = new Creem({
  // 根据环境选择服务器，0 是 live_mode, 1 是 test_mode
  serverIdx: env.CREEM_ENVIRONMENT === "live_mode" ? 0 : 1,
});

export const creemApiKey = env.CREEM_API_KEY;
export const creemWebhookSecret = env.CREEM_WEBHOOK_SECRET;
