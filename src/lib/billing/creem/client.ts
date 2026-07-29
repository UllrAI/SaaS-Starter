import "server-only";

import { getBillingConfig } from "@/lib/config/integrations";
import { createCreemClient } from "./api-client";

export type CreemClient = ReturnType<typeof createCreemClient>;

let client: CreemClient | undefined;

export function getCreemClient(): CreemClient {
  if (!client) {
    const config = getBillingConfig();
    client = createCreemClient({
      apiKey: config.apiKey,
      environment: config.environment,
    });
  }
  return client;
}

export function getCreemEnvironment() {
  return getBillingConfig().environment;
}
