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
  await expect(page.getByPlaceholder(/Send a message/)).toBeVisible();
});
