export type RateLimitInfo = {
  limit: number;
  remaining: number;
  resetAt: number;
};

export type ApiKeyPublic = {
  id: string;
  name: string;
  keyPrefix: string;
  lastFourChars: string;
  rateLimit: number;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type GeneratedApiKey = {
  rawKey: string;
  record: ApiKeyPublic;
};

export type CliTokenPublic = {
  id: string;
  name: string;
  tokenPrefix: string;
  lastFourChars: string;
  isActive: boolean;
  expiresAt: string;
  lastUsedAt: string | null;
  deviceOs: string | null;
  deviceHostname: string | null;
  cliVersion: string | null;
  createdAt: string;
};

export type DeviceCodeResponse = {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
};

export type DeviceTokenPendingStatus =
  | "authorization_pending"
  | "slow_down"
  | "expired";

export type DeviceTokenPendingResponse = {
  status: DeviceTokenPendingStatus;
};

export type DeviceTokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: "bearer";
  expiresIn: number;
};

export type AuthVerifyResponse = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  authMethod: "api_key" | "cli_token";
  apiKey: {
    name: string | null;
    rateLimit: number | null;
  };
};

