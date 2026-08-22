import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

// These checks never send a message, so no LLM call is made and CI needs no
// real provider credentials.

test("rejects unauthenticated chat requests", async ({ page }) => {
  const response = await page.request.post("/api/chat", {
    data: {
      messages: [
        { id: "m1", role: "user", parts: [{ type: "text", text: "hi" }] },
      ],
    },
  });

  expect(response.status()).toBe(401);
});

test("rejects malformed chat requests from a signed-in user", async ({
  page,
}) => {
  await loginAs(page, "user");

  const response = await page.request.post("/api/chat", {
    data: { messages: [] },
  });

  expect(response.status()).toBe(400);
});

test("shows the assistant composer to a signed-in user", async ({ page }) => {
  await loginAs(page, "user");

  await page.goto("/dashboard/ai");

  await expect(page).toHaveURL(/\/dashboard\/ai$/);
  await expect(page.getByText("How can I help?")).toBeVisible();
  await expect(page.getByPlaceholder(/Ask, draft, or create/)).toBeVisible();
  await expect(page.getByLabel("Reasoning effort")).toContainText(
    "Low reasoning",
  );
  await expect(page.getByRole("region", { name: "Canvas" })).toBeVisible();
});

test("restores the same account's conversations in another browser", async ({
  browser,
}) => {
  const firstPage = await browser.newPage();
  await loginAs(firstPage, "user");

  const created = await firstPage.request.post("/api/ai/conversations");
  expect(created.status()).toBe(201);
  const payload = (await created.json()) as {
    conversation: { id: string };
  };

  await firstPage.goto(
    `/dashboard/ai?conversation=${encodeURIComponent(payload.conversation.id)}`,
  );
  await expect(firstPage.locator("aside").getByText("New chat")).toBeVisible();

  const secondPage = await browser.newPage();
  await loginAs(secondPage, "user");
  await secondPage.goto("/dashboard/ai");
  await expect(secondPage.locator("aside").getByText("New chat")).toBeVisible();

  await firstPage.close();
  await secondPage.close();
});
