import type { apiKeys } from "@/database/schema";
import type {
  ApiKeyPublic,
  GeneratedApiKey,
  RateLimitInfo,
} from "@/lib/machine-auth/types";

export type ApiKeyRow = typeof apiKeys.$inferSelect;

export type { ApiKeyPublic, GeneratedApiKey, RateLimitInfo };

export type ApiKeyAuthResult = {
  userId: string;
  apiKeyId: string;
  rateLimit: number;
};

