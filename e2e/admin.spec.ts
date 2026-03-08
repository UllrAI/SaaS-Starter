import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("redirects a regular user away from admin pages", async ({ page }) => {
  await loginAs(page, "user");

  await page.goto("/dashboard/admin");

  await expect(page).toHaveURL(/\/dashboard$/);
});

test("allows an admin session to open the admin dashboard", async ({ page }) => {
  await loginAs(page, "admin");

  await page.goto("/dashboard/admin");

  await expect(page).toHaveURL(/\/dashboard\/admin$/);
  await expect(page.getByText("Total Users")).toBeVisible();
});
