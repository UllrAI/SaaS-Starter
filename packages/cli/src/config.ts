import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import {
  CLI_API_KEY_ENV,
  CLI_BASE_URL_ENV,
  CLI_CONFIG_DIR,
  CLI_CONFIG_FILE_NAME,
} from "./runtime";

export type CliConfig = {
  apiKey?: string;
  baseUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
};

const CONFIG_DIR = join(homedir(), CLI_CONFIG_DIR);
const CONFIG_FILE = join(CONFIG_DIR, CLI_CONFIG_FILE_NAME);
const DEFAULT_BASE_URL = "http://127.0.0.1:3000";

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function loadConfig(): CliConfig {
  if (!existsSync(CONFIG_FILE)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf8")) as CliConfig;
  } catch {
    return {};
  }
}

export function saveConfig(config: CliConfig): void {
  mkdirSync(CONFIG_DIR, {
    recursive: true,
    mode: 0o700,
  });
  writeFileSync(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`);
  chmodSync(CONFIG_FILE, 0o600);
}

export function getBaseUrl(): string {
  return process.env[CLI_BASE_URL_ENV] ?? loadConfig().baseUrl ?? DEFAULT_BASE_URL;
}

export function getAuthToken(): string | undefined {
  const config = loadConfig();

  if (config.accessToken) {
    return config.accessToken;
  }

  return process.env[CLI_API_KEY_ENV] ?? config.apiKey;
}

export function requireAuthToken(): string {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      "Not authenticated. Run `pnpm saas-cli -- auth login`, or set SAAS_CLI_API_KEY.",
    );
  }

  return token;
}
