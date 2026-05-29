import { defineConfig, devices } from "@playwright/test";
import { randomBytes } from "node:crypto";

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;
const e2eTestSecret =
  process.env.E2E_TEST_SECRET ?? randomBytes(32).toString("hex");

process.env.E2E_TEST_SECRET = e2eTestSecret;

export default defineConfig({
  testDir: "./e2e",
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
    command: `PORT=${port} NEXT_PUBLIC_APP_URL=${baseURL} E2E_TEST_MODE=true PLAYWRIGHT=true E2E_TEST_SECRET=${e2eTestSecret} pnpm start`,
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
