import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { startAiWorkerFixture } from "./ai-worker-fixture";
import { startAiSubscriptionProxy } from "./ai-subscription-proxy";

test.describe("durable assistant runs", () => {
  test.describe.configure({ mode: "serial" });
  let worker: Awaited<ReturnType<typeof startAiWorkerFixture>>;
  test.beforeAll(async () => {
    worker = await startAiWorkerFixture();
  });
  test.afterAll(async () => {
    await worker?.stop();
  });

  test("keeps generating after the page closes and restores the active run", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "user");
    await page.goto("/dashboard/ai");
    await page.getByRole("button", { name: "New chat", exact: true }).click();
    const prompt = "close and reopen durable test";
    await page.getByRole("textbox", { name: "Message" }).fill(prompt);
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await worker.waitForPrompt(prompt);
    const url = page.url();
    await page.close();
    const restored = await context.newPage();
    await restored.goto(url);
    const answer = restored.getByText(`Durable worker answer: ${prompt}`, {
      exact: true,
    });
    await expect(answer).toBeVisible({ timeout: 20_000 });
    await expect(answer).toHaveCount(1);
    await expect(
      restored.getByRole("button", { name: "Stop", exact: true }),
    ).toBeHidden();
    await restored.reload();
    await expect(answer).toBeVisible();
    await expect(answer).toHaveCount(1);
    await context.close();
  });

  test("replays saved events after a network disconnect without resubmitting", async ({
    page,
  }) => {
    await loginAs(page, "user");
    await page.goto("/dashboard/ai");
    await page.getByRole("button", { name: "New chat", exact: true }).click();
    const proxy = await startAiSubscriptionProxy(new URL(page.url()).origin);
    try {
      await page.route("**/api/ai/runs/*/stream**", async (route) => {
        const url = new URL(route.request().url());
        await route.continue({
          url: `${proxy.origin}${url.pathname}${url.search}`,
        });
      });
      const prompt = "network reconnect durable test";
      let admissions = 0;
      const cursors: number[] = [];
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (url.pathname === "/api/chat" && request.method() === "POST")
          admissions += 1;
        if (url.pathname.endsWith("/stream"))
          cursors.push(Number(url.searchParams.get("cursor")));
      });
      await page.getByRole("textbox", { name: "Message" }).fill(prompt);
      await page.getByRole("button", { name: "Send", exact: true }).click();
      await worker.waitForPrompt(prompt);
      await expect(
        page.getByText("Working on your durable test.", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("Reconnecting. Your assistant is still working."),
      ).toBeVisible({ timeout: 10_000 });
      proxy.restore();
      const answer = page.getByText(`Durable worker answer: ${prompt}`, {
        exact: true,
      });
      await expect(answer).toBeVisible({ timeout: 20_000 });
      await expect(answer).toHaveCount(1);
      expect(admissions).toBe(1);
      expect(cursors.some((cursor) => cursor > 0)).toBe(true);
    } finally {
      await page.unroute("**/api/ai/runs/*/stream**");
      await proxy.close();
    }
  });

  test("restores a failed run after refresh and manually retries its accepted input", async ({
    page,
  }) => {
    await loginAs(page, "user");
    await page.goto("/dashboard/ai");
    await page.getByRole("button", { name: "New chat", exact: true }).click();
    const prompt = "retry durable test";
    const accepted = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/chat" &&
        response.request().method() === "POST",
    );
    await page.getByRole("textbox", { name: "Message" }).fill(prompt);
    await page.getByRole("button", { name: "Send", exact: true }).click();
    const initial = (await (await accepted).json()) as {
      runId: string;
      assistantMessageId: string;
      conversationId: string;
    };
    await worker.waitForPrompt(prompt);
    await expect(
      page.getByRole("button", { name: "Try again", exact: true }),
    ).toBeVisible({ timeout: 20_000 });
    await page.reload();
    await expect(
      page.getByText("Working on your durable test.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Try again", exact: true }),
    ).toBeVisible();
    const retryAccepted = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/chat" &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    const retryResponse = await retryAccepted;
    expect(retryResponse.status()).toBe(202);
    expect(retryResponse.request().postDataJSON()).toMatchObject({
      retryRunId: initial.runId,
    });
    const retry = (await retryResponse.json()) as {
      runId: string;
      assistantMessageId: string;
    };
    expect(retry.runId).not.toBe(initial.runId);
    expect(retry.assistantMessageId).toBe(initial.assistantMessageId);
    const answer = page.getByText(`Durable worker answer: ${prompt}`, {
      exact: true,
    });
    await expect(answer).toBeVisible({ timeout: 20_000 });
    await expect(answer).toHaveCount(1);
    await page.reload();
    await expect(answer).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Try again", exact: true }),
    ).toHaveCount(0);
    const detail = (await (
      await page.request.get(`/api/ai/conversations/${initial.conversationId}`)
    ).json()) as { messages: Array<{ id: string; role: string }> };
    expect(
      detail.messages.filter((message) => message.role === "user"),
    ).toHaveLength(1);
    expect(
      detail.messages.filter(
        (message) => message.id === initial.assistantMessageId,
      ),
    ).toHaveLength(1);
  });

  test("retries a rejected new question instead of regenerating the previous completed run", async ({
    page,
  }) => {
    await loginAs(page, "user");
    await page.goto("/dashboard/ai");
    await page.getByRole("button", { name: "New chat", exact: true }).click();
    const firstPrompt = "completed before admission rejection durable test";
    await page.getByRole("textbox", { name: "Message" }).fill(firstPrompt);
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      page.getByText(`Durable worker answer: ${firstPrompt}`, { exact: true }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("button", { name: "Stop", exact: true }),
    ).toBeHidden();
    let rejected = false;
    await page.route("**/api/chat", async (route) => {
      if (!rejected) {
        rejected = true;
        await route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({ code: "ai_budget_reached" }),
        });
      } else await route.continue();
    });
    const newPrompt = "new question after rejection durable test";
    await page.getByRole("textbox", { name: "Message" }).fill(newPrompt);
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Try again", exact: true }),
    ).toBeVisible();
    const retryRequest = page.waitForRequest(
      (request) =>
        new URL(request.url()).pathname === "/api/chat" &&
        request.method() === "POST",
    );
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    const retryBody = (await retryRequest).postDataJSON() as {
      retryRunId?: string;
      messages: Array<{ parts: Array<{ text?: string }> }>;
    };
    expect(retryBody.retryRunId).toBeUndefined();
    expect(retryBody.messages[0].parts[0].text).toBe(newPrompt);
    await expect(
      page.getByText(`Durable worker answer: ${newPrompt}`, { exact: true }),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("explicit Stop cancels the Worker and keeps saved partial output", async ({
    page,
  }) => {
    await loginAs(page, "user");
    await page.goto("/dashboard/ai");
    await page.getByRole("button", { name: "New chat", exact: true }).click();
    const prompt = "cancel durable test";
    const accepted = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/chat" &&
        response.request().method() === "POST",
    );
    await page.getByRole("textbox", { name: "Message" }).fill(prompt);
    await page.getByRole("button", { name: "Send", exact: true }).click();
    const { runId } = (await (await accepted).json()) as { runId: string };
    await worker.waitForPrompt(prompt);
    await expect(
      page.getByText("Working on your durable test.", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    await expect
      .poll(
        async () =>
          (await (await page.request.get(`/api/ai/runs/${runId}`)).json())
            .status,
      )
      .toBe("aborted");
    await expect(
      page.getByRole("button", { name: "Stop", exact: true }),
    ).toBeHidden();
    await page.reload();
    await expect(
      page.getByText("Generation stopped.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Working on your durable test.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(`Durable worker answer: ${prompt}`, { exact: true }),
    ).toHaveCount(0);
  });
});
