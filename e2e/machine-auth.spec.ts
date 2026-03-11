import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("creates an API key from settings and uses it against the v1 auth endpoint", async ({
  page,
}) => {
  await loginAs(page, "user");
  await page.goto("/dashboard/settings");

  await expect(page.getByText("API Keys", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Create Key" }).click();
  await page.getByLabel("Name").fill("Playwright Key");
  await page.getByRole("button", { name: "Create" }).click();

  const rawKey = await page.getByRole("dialog").locator("code").textContent();
  expect(rawKey).toBeTruthy();
  expect(rawKey).toMatch(/^ssk_/);

  const verifyResponse = await page.request.get("/api/v1/auth/verify", {
    headers: {
      authorization: `Bearer ${rawKey!}`,
    },
  });
  const verifyPayload = await verifyResponse.json();

  expect(verifyResponse.ok()).toBeTruthy();
  expect(verifyPayload.data.authMethod).toBe("api_key");
  expect(verifyPayload.data.apiKey.name).toBe("Playwright Key");
});

test("authorizes a CLI device through the browser and exchanges it for a CLI token", async ({
  page,
}) => {
  await loginAs(page, "user");

  const codeResponse = await page.request.post("/api/v1/device/code", {
    data: {
      clientName: "Playwright CLI",
      clientVersion: "0.1.0",
      deviceOs: "darwin",
      deviceHostname: "pw-host",
    },
  });
  const codePayload = await codeResponse.json();

  expect(codeResponse.ok()).toBeTruthy();
  expect(codePayload.data.userCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);

  await page.goto(`/device?code=${encodeURIComponent(codePayload.data.userCode)}`);
  await page.getByRole("button", { name: "Authorize" }).click();

  await expect(page.getByText("Device authorized")).toBeVisible();

  const tokenResponse = await page.request.post("/api/v1/device/token", {
    data: {
      deviceCode: codePayload.data.deviceCode,
    },
  });
  const tokenPayload = await tokenResponse.json();

  expect(tokenResponse.ok()).toBeTruthy();
  expect(tokenPayload.data.accessToken).toMatch(/^sst_/);
  expect(tokenPayload.data.refreshToken).toMatch(/^ssr_/);

  const verifyResponse = await page.request.get("/api/v1/auth/verify", {
    headers: {
      authorization: `Bearer ${tokenPayload.data.accessToken}`,
    },
  });
  const verifyPayload = await verifyResponse.json();

  expect(verifyResponse.ok()).toBeTruthy();
  expect(verifyPayload.data.authMethod).toBe("cli_token");
});
