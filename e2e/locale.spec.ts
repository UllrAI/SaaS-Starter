import { expect, test } from "@playwright/test";

test("canonicalizes zh locale aliases to zh-Hans marketing routes", async ({
  page,
}) => {
  await page.goto("/zh/about");

  await expect(page).toHaveURL(/\/zh-Hans\/about$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("redirects /en-prefixed marketing routes to canonical English paths", async ({
  page,
}) => {
  await page.goto("/en/about");

  await expect(page).toHaveURL(/\/about$/);
  await expect(
    page.getByRole("heading", { name: /Building the future of SaaS/i }),
  ).toBeVisible();
});
