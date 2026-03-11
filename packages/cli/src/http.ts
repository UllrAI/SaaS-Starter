import {
  CLI_REFRESH_PREFIX,
  CLI_TOKEN_PREFIX,
} from "../../../src/lib/machine-auth/constants";
import {
  getBaseUrl,
  loadConfig,
  requireAuthToken,
  saveConfig,
} from "./config";

type ApiEnvelope<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
      };
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

export async function tryRefreshToken(): Promise<string | null> {
  const config = loadConfig();
  if (!config.refreshToken?.startsWith(CLI_REFRESH_PREFIX)) {
    return null;
  }

  const response = await fetch(`${getBaseUrl()}/api/v1/device/refresh`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      refreshToken: config.refreshToken,
    }),
  });

  const payload = (await response.json()) as ApiEnvelope<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }>;

  if (!response.ok || !payload.success) {
    return null;
  }

  config.accessToken = payload.data.accessToken;
  config.refreshToken = payload.data.refreshToken;
  config.tokenExpiresAt = new Date(
    Date.now() + payload.data.expiresIn * 1000,
  ).toISOString();
  saveConfig(config);

  return payload.data.accessToken;
}

export async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const baseUrl = getBaseUrl();
  const token = requireAuthToken();
  const headers: Record<string, string> = {
    authorization: `Bearer ${token}`,
    accept: "application/json",
  };

  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }

  let response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && token.startsWith(CLI_TOKEN_PREFIX)) {
    const nextToken = await tryRefreshToken();
    if (nextToken) {
      headers.authorization = `Bearer ${nextToken}`;
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    }
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.success) {
    throw new Error(
      payload.success ? "Unexpected API response." : payload.error.message,
    );
  }

  return payload.data;
}

export async function verifyAuth(): Promise<AuthVerifyResponse> {
  return request<AuthVerifyResponse>("GET", "/api/v1/auth/verify");
}

