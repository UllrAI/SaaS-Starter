import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("redirects unauthenticated dashboard requests to login", async ({ page }) => {
  await page.goto("/dashboard/settings");

  await expect(page).toHaveURL(
    /\/login\?callbackUrl=%2Fdashboard%2Fsettings(?:&|$)/,
  );
});

test("allows an E2E user session to access the dashboard", async ({ page }) => {
  const user = await loginAs(page, "user");

  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Account overview", { exact: true })).toBeVisible();
  await expect(page.getByText(user.email)).toBeVisible();
});
