#!/usr/bin/env node

import { hostname } from "os";
import { CLI_TOKEN_PREFIX } from "../../../src/lib/machine-auth/constants";
import { parseCliArgs } from "./args";
import {
  getBaseUrl,
  getConfigPath,
  getAuthToken,
  loadConfig,
  saveConfig,
} from "./config";
import { request, verifyAuth } from "./http";
import { openBrowser } from "./open-browser";
import { pollDeviceToken } from "./device-login";
import { CLI_DISPLAY_NAME, CLI_NAME, CLI_VERSION } from "./runtime";

type DeviceCodeResponse = {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
};

function printUsage() {
  console.log(`Usage:
  pnpm ${CLI_NAME} -- auth login [--base-url URL] [--no-browser]
  pnpm ${CLI_NAME} -- auth status [--base-url URL]
  pnpm ${CLI_NAME} -- auth refresh [--base-url URL]
  pnpm ${CLI_NAME} -- auth logout`);
}

function resolveBaseUrl(baseUrlOverride?: string): string {
  if (!baseUrlOverride) {
    return getBaseUrl();
  }

  const config = loadConfig();
  config.baseUrl = baseUrlOverride;
  saveConfig(config);
  return baseUrlOverride;
}

async function runLogin(options: { baseUrl?: string; noBrowser: boolean }) {
  const baseUrl = resolveBaseUrl(options.baseUrl);
  const shouldOpenBrowser = !options.noBrowser;
  const deviceHostname = hostname();

  const startedAt = Date.now();
  const response = await fetch(`${baseUrl}/api/v1/device/code`, {
    signal: AbortSignal.timeout(15_000),
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      clientName: CLI_DISPLAY_NAME,
      clientVersion: CLI_VERSION,
      deviceOs: process.platform,
      deviceHostname,
    }),
  });

  const payload = (await response.json()) as {
    success: boolean;
    data?: DeviceCodeResponse;
    error?: { message: string };
  };

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error?.message ?? "Failed to request device code.");
  }

  const { deviceCode, userCode, expiresIn, interval } = payload.data;
  const browserUrl = `${baseUrl}/device?code=${encodeURIComponent(userCode)}`;

  console.log("");
  console.log("Your one-time code:");
  console.log(`  ${userCode}`);
  console.log("");

  if (shouldOpenBrowser) {
    console.log(`Opening ${browserUrl}`);
    openBrowser(browserUrl);
  } else {
    console.log(`Open this URL in your browser: ${browserUrl}`);
  }

  const remainingMs = startedAt + expiresIn * 1000 - Date.now();
  const signal = AbortSignal.timeout(Math.max(0, remainingMs));
  const credentials = await pollDeviceToken(
    baseUrl,
    deviceCode,
    interval,
    signal,
  );
  const config = loadConfig();
  config.accessToken = credentials.accessToken;
  config.refreshToken = credentials.refreshToken;
  config.tokenExpiresAt = new Date(
    Date.now() + (credentials.expiresIn ?? 0) * 1000,
  ).toISOString();
  saveConfig(config);

  const verifiedUser = await verifyAuth(
    AbortSignal.any([signal, AbortSignal.timeout(5_000)]),
  ).catch(() => null);
  console.log("");
  console.log("Authenticated.");
  if (verifiedUser) {
    console.log(
      `User: ${verifiedUser.user.name || verifiedUser.user.email} (${verifiedUser.user.email})`,
    );
  }
  console.log(`Config: ${getConfigPath()}`);
}

async function runStatus(options: { baseUrl?: string }) {
  resolveBaseUrl(options.baseUrl);
  const token = getAuthToken();

  console.log(`Config: ${getConfigPath()}`);
  console.log(`Server: ${getBaseUrl()}`);
  console.log("");

  if (!token) {
    console.log("Not authenticated.");
    return;
  }

  console.log(
    token.startsWith(CLI_TOKEN_PREFIX) ? "Auth: CLI token" : "Auth: API key",
  );

  const verifiedUser = await verifyAuth();
  console.log(`User: ${verifiedUser.user.name || verifiedUser.user.email}`);
  if (verifiedUser.apiKey.name) {
    console.log(`Key: ${verifiedUser.apiKey.name}`);
  }
}

async function runRefresh(options: { baseUrl?: string }) {
  resolveBaseUrl(options.baseUrl);
  const config = loadConfig();

  if (!config.refreshToken) {
    throw new Error(
      "No refresh token found. Run `pnpm saas-cli -- auth login`.",
    );
  }

  const payload = await request<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }>("POST", "/api/v1/device/refresh", {
    refreshToken: config.refreshToken,
  });

  config.accessToken = payload.accessToken;
  config.refreshToken = payload.refreshToken;
  config.tokenExpiresAt = new Date(
    Date.now() + payload.expiresIn * 1000,
  ).toISOString();
  saveConfig(config);

  console.log("Token refreshed.");
}

async function runLogout() {
  const config = loadConfig();
  config.accessToken = undefined;
  config.refreshToken = undefined;
  config.tokenExpiresAt = undefined;
  saveConfig(config);
  console.log("Logged out.");
}

async function main() {
  const parsedArgs = parseCliArgs(process.argv.slice(2));
  const [scope, command] = parsedArgs.positionals;

  if (scope !== "auth" || !command) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  try {
    if (command === "login") {
      await runLogin({
        baseUrl: parsedArgs.baseUrl,
        noBrowser: parsedArgs.noBrowser,
      });
      return;
    }

    if (command === "status") {
      await runStatus({
        baseUrl: parsedArgs.baseUrl,
      });
      return;
    }

    if (command === "refresh") {
      await runRefresh({
        baseUrl: parsedArgs.baseUrl,
      });
      return;
    }

    if (command === "logout") {
      await runLogout();
      return;
    }

    printUsage();
    process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

void main();
