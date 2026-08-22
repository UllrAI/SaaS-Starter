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
  await expect(page.getByLabel("Reasoning effort")).toHaveText("Low");
  await expect(
    page.locator('button[aria-label="Attach images"]'),
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "Canvas" })).toBeHidden();

  await page.getByRole("button", { name: "Open canvas" }).click();
  await expect(page.getByRole("region", { name: "Canvas" })).toBeVisible();
  const canvasResizeHandle = page.getByRole("separator", {
    name: "Resize canvas",
  });
  await canvasResizeHandle.press("ArrowLeft");
  await expect(canvasResizeHandle).toHaveAttribute("aria-valuenow", "53");

  await page.getByRole("button", { name: "Collapse chat history" }).click();
  await expect(
    page.getByRole("button", { name: "Expand chat history" }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("button", { name: "Expand chat history" }),
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "Canvas" })).toBeVisible();
  await expect(
    page.getByRole("separator", { name: "Resize canvas" }),
  ).toHaveAttribute("aria-valuenow", "53");

  await page.setViewportSize({ width: 1024, height: 900 });
  await page.reload();
  await expect(page.getByRole("button", { name: "Open canvas" })).toBeVisible();
  await page.getByRole("button", { name: "Open canvas" }).click();
  await expect(page.getByRole("region", { name: "Canvas" })).toBeVisible();
  await expect(
    page.getByRole("separator", { name: "Resize canvas" }),
  ).toHaveCount(0);
});

test("uploads a reference image and enables an image-only message", async ({
  page,
}) => {
  await loginAs(page, "user");

  const publicUrl = "https://cdn.example.com/reference.png";
  await page.route("**/api/upload/presigned-url", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        intentId: "0192f26a-8c1f-7c2f-9ca9-5d3930d2fc75",
        key: "uploads/user-1/reference.png",
        presignedUrl:
          "https://test.r2.cloudflarestorage.com/reference.png?signature=test",
        protocolVersion: 2,
        publicUrl,
        requiredHeaders: {
          "Content-Type": "image/png",
          "If-None-Match": "*",
        },
      }),
    });
  });
  await page.route(
    "https://test.r2.cloudflarestorage.com/**",
    async (route) => {
      await route.fulfill({ status: 200 });
    },
  );
  await page.route("**/api/upload/complete", async (route) => {
    const body = route.request().postDataJSON() as {
      fileName: string;
      size: number;
    };
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        file: {
          key: "uploads/user-1/reference.png",
          url: publicUrl,
          fileName: body.fileName,
          size: body.size,
          contentType: "image/png",
        },
      }),
    });
  });

  await page.goto("/dashboard/ai");
  await page
    .locator('input[type="file"][aria-label="Attach images"]')
    .setInputFiles({
      name: "reference.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    });

  await expect(page.getByAltText("reference.png")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send" })).toBeEnabled();
});

test("archives and restores a conversation", async ({ page }) => {
  await loginAs(page, "user");

  const created = await page.request.post("/api/ai/conversations");
  expect(created.status()).toBe(201);
  const payload = (await created.json()) as {
    conversation: { id: string };
  };

  const archived = await page.request.patch(
    `/api/ai/conversations/${payload.conversation.id}`,
    { data: { archived: true } },
  );
  expect(archived.status()).toBe(200);

  const activePage = await page.request.get(
    "/api/ai/conversations?archived=false",
  );
  const archivedPage = await page.request.get(
    "/api/ai/conversations?archived=true",
  );
  const activePayload = (await activePage.json()) as {
    conversations: Array<{ id: string }>;
  };
  const archivedPayload = (await archivedPage.json()) as {
    conversations: Array<{ id: string }>;
  };
  expect(activePayload.conversations).not.toContainEqual(
    expect.objectContaining({ id: payload.conversation.id }),
  );
  expect(archivedPayload.conversations).toContainEqual(
    expect.objectContaining({ id: payload.conversation.id }),
  );

  const restored = await page.request.patch(
    `/api/ai/conversations/${payload.conversation.id}`,
    { data: { archived: false } },
  );
  expect(restored.status()).toBe(200);
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
  await expect(firstPage).toHaveURL(
    new RegExp(`conversation=${payload.conversation.id}`),
  );

  const secondPage = await browser.newPage();
  await loginAs(secondPage, "user");
  await secondPage.goto("/dashboard/ai");
  await expect(secondPage).toHaveURL(
    new RegExp(`conversation=${payload.conversation.id}`),
  );

  await firstPage.close();
  await secondPage.close();
});
