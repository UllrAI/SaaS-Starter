import { defineConfig, devices } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { resolveE2EEnvironment } from "./e2e/environment";

const { databaseUrl, origin: baseURL, port } = resolveE2EEnvironment();
const e2eTestSecret =
  process.env.E2E_TEST_SECRET ?? randomBytes(32).toString("hex");

process.env.DATABASE_URL = databaseUrl;
process.env.E2E_TEST_SECRET = e2eTestSecret;
process.env.NEXT_PUBLIC_APP_URL = baseURL;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  timeout: 45 * 1000,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "pnpm start",
    env: {
      DATABASE_URL: databaseUrl,
      E2E_DATABASE_URL: databaseUrl,
      E2E_TEST_MODE: "true",
      E2E_TEST_SECRET: e2eTestSecret,
      NEXT_PUBLIC_APP_URL: baseURL,
      PLAYWRIGHT: "true",
      PORT: String(port),
    },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
