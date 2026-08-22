import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("creates, polls, deduplicates, authorizes, and cancels a background task", async ({
  browser,
  page,
}) => {
  await loginAs(page, "user");

  const idempotencyKey = `playwright-${Date.now()}`;
  const createResponse = await page.request.post("/api/tasks/example", {
    data: { message: "durable work", idempotencyKey },
  });
  expect(createResponse.status()).toBe(202);
  const created = await createResponse.json();
  expect(created.task).toMatchObject({
    kind: "example.process",
    status: "queued",
    scopeKey: "user:e2e-user",
    idempotencyKey,
  });

  const duplicateResponse = await page.request.post("/api/tasks/example", {
    data: { message: "durable work", idempotencyKey },
  });
  expect(duplicateResponse.status()).toBe(200);
  expect((await duplicateResponse.json()).task.id).toBe(created.task.id);

  const pollResponse = await page.request.get(`/api/tasks/${created.task.id}`);
  expect(pollResponse.status()).toBe(200);
  expect((await pollResponse.json()).task.id).toBe(created.task.id);

  const foreignContext = await browser.newContext();
  const foreignPage = await foreignContext.newPage();
  await loginAs(foreignPage, "admin");
  const foreignResponse = await foreignPage.request.get(
    `/api/tasks/${created.task.id}`,
  );
  expect(foreignResponse.status()).toBe(404);
  await foreignContext.close();

  const cancelResponse = await page.request.post(
    `/api/tasks/${created.task.id}/cancel`,
  );
  expect(cancelResponse.status()).toBe(200);
  expect((await cancelResponse.json()).task.status).toBe("cancelled");

  const cancelledPoll = await page.request.get(`/api/tasks/${created.task.id}`);
  expect((await cancelledPoll.json()).task.status).toBe("cancelled");
});
