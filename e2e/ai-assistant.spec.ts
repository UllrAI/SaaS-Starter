import { expect, test } from "@playwright/test";
import { createChat } from "@shadcn/helpers/ai-sdk";
import type { UIMessageChunk } from "ai";
import type { AiMessage } from "../src/lib/ai/chat-history-types";
import { loginAs } from "./helpers/auth";

// These checks never send a message, so no LLM call is made and CI needs no
// real provider credentials.

async function readMessageChunks(stream: ReadableStream<UIMessageChunk>) {
  const chunks: string[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(JSON.stringify(value));
  }
  return chunks;
}

async function createStreamingChatFixture() {
  const firstPrompt = "Explain the migration in detail";
  const secondPrompt = "Give me the final conclusion";
  const firstAnswer = `${Array.from(
    { length: 120 },
    (_, index) =>
      `Migration detail ${index + 1} remains visible while streaming.`,
  ).join(" ")} Final first-turn marker.`;
  const secondAnswer = `${Array.from(
    { length: 40 },
    (_, index) =>
      `Conclusion detail ${index + 1} follows the current question.`,
  ).join(" ")} Final second-turn marker.`;
  const chat = createChat<AiMessage>({ now: "2026-08-22T00:00:00Z" })
    .user(firstPrompt, { id: "first-user" })
    .assistant(firstAnswer, { id: "first-assistant" })
    .user(secondPrompt, { id: "second-user" })
    .assistant(secondAnswer, { id: "second-assistant" });
  const transport = chat.transport({ delayMs: 0 });
  const send = (messages: AiMessage[]) =>
    transport.sendMessages({
      abortSignal: undefined,
      chatId: "e2e-chat",
      messageId: undefined,
      messages,
      trigger: "submit-message",
    });

  return {
    firstChunks: await readMessageChunks(await send(chat.get(1))),
    firstPrompt,
    secondChunks: await readMessageChunks(await send(chat.get(3))),
    secondPrompt,
  };
}

async function createImageChatChunks(publicUrl: string) {
  const chat = createChat<AiMessage>({ now: "2026-08-22T00:00:00Z" })
    .user("", {
      id: "image-user",
      files: [
        {
          filename: "reference.png",
          mediaType: "image/png",
          url: publicUrl,
        },
      ],
    })
    .assistant("Image received.", { id: "image-assistant" });
  const stream = await chat.transport({ delayMs: 0 }).sendMessages({
    abortSignal: undefined,
    chatId: "e2e-image-chat",
    messageId: undefined,
    messages: chat.get(1),
    trigger: "submit-message",
  });

  return readMessageChunks(stream);
}

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
  await expect(page.getByRole("region", { name: "Canvas" })).toBeHidden();
  await page.getByRole("button", { name: "Open canvas" }).click();
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

test("keeps the current turn anchored while streaming", async ({ page }) => {
  await loginAs(page, "user");
  const fixture = await createStreamingChatFixture();

  await page.addInitScript(
    ({ firstChunks, firstPrompt, secondChunks, secondPrompt }) => {
      const originalFetch = window.fetch.bind(window);

      window.fetch = async (input, init) => {
        const requestUrl = new URL(
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url,
          window.location.href,
        );
        if (requestUrl.pathname !== "/api/chat") {
          return originalFetch(input, init);
        }

        const rawBody =
          typeof init?.body === "string"
            ? init.body
            : input instanceof Request
              ? await input.clone().text()
              : "{}";
        const body = JSON.parse(rawBody) as {
          messages?: Array<{
            role: string;
            parts?: Array<{ type: string; text?: string }>;
          }>;
        };
        const latestUserText = body.messages
          ?.findLast((message) => message.role === "user")
          ?.parts?.filter((part) => part.type === "text")
          .map((part) => part.text ?? "")
          .join("\n");
        const chunks =
          latestUserText === secondPrompt ? secondChunks : firstChunks;
        if (latestUserText !== firstPrompt && latestUserText !== secondPrompt) {
          return new Response("Unexpected E2E chat prompt.", { status: 400 });
        }

        const encoder = new TextEncoder();
        let chunkIndex = 0;
        return new Response(
          new ReadableStream({
            start(controller) {
              const enqueueNext = () => {
                const chunk = chunks[chunkIndex];
                if (!chunk) {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  controller.close();
                  return;
                }

                controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
                chunkIndex += 1;
                window.setTimeout(enqueueNext, 4);
              };

              enqueueNext();
            },
          }),
          {
            headers: {
              "content-type": "text/event-stream",
              "x-vercel-ai-ui-message-stream": "v1",
            },
          },
        );
      };
    },
    fixture,
  );

  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto("/dashboard/ai");
  const composer = page.getByRole("textbox", { name: "Message" });
  const viewport = page.locator('[data-slot="message-scroller-viewport"]');

  await composer.fill(fixture.firstPrompt);
  await composer.press("Enter");
  const stopButton = page.getByRole("button", { name: "Stop" });
  await expect(page.getByText(/Migration detail 20 remains/)).toBeVisible();
  await expect(stopButton).toBeVisible();
  await expect
    .poll(() =>
      viewport.evaluate(
        (element) =>
          element.scrollHeight - element.scrollTop - element.clientHeight,
      ),
    )
    .toBeLessThan(4);

  await viewport.dispatchEvent("wheel", { deltaY: -1000 });
  await viewport.evaluate((element) => {
    element.scrollTop = 0;
    element.dispatchEvent(new Event("scroll"));
  });
  const jumpToLatest = page.getByRole("button", {
    name: "Jump to latest message",
  });
  await expect(jumpToLatest).toBeVisible();
  await jumpToLatest.click();
  await expect
    .poll(() =>
      viewport.evaluate(
        (element) =>
          element.scrollHeight - element.scrollTop - element.clientHeight,
      ),
    )
    .toBeLessThan(4);
  await expect(page.getByText(/Migration detail 80 remains/)).toBeVisible();
  await expect(stopButton).toBeVisible();
  await expect
    .poll(() =>
      viewport.evaluate(
        (element) =>
          element.scrollHeight - element.scrollTop - element.clientHeight,
      ),
    )
    .toBeLessThan(4);
  await expect(page.getByText("Final first-turn marker.")).toBeVisible({
    timeout: 15_000,
  });
  await expect(stopButton).toBeHidden();

  await composer.fill(fixture.secondPrompt);
  await composer.press("Enter");
  const currentQuestion = viewport.getByText(fixture.secondPrompt, {
    exact: true,
  });
  await expect(page.getByText(/Conclusion detail 1 follows/)).toBeVisible();
  await expect(currentQuestion).toBeInViewport();
  await expect(page.getByText("Final second-turn marker.")).toBeVisible({
    timeout: 15_000,
  });
  await expect
    .poll(() =>
      viewport.evaluate(
        (element) =>
          element.scrollHeight - element.scrollTop - element.clientHeight,
      ),
    )
    .toBeLessThan(4);

  await page.getByRole("button", { name: "New chat", exact: true }).click();
  await expect(page.getByText("How can I help?")).toBeVisible();
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBe(0);
});

test("asks before running a write tool and resumes once approved", async ({
  page,
}) => {
  await loginAs(page, "user");

  // The pause and the resume are two separate turns, so the stub answers by
  // request order rather than by prompt.
  const approvalChunks = [
    { type: "start" },
    { type: "start-step" },
    {
      type: "tool-input-available",
      toolCallId: "call-1",
      toolName: "saveDocument",
      input: { fileName: "launch-plan.md", content: "# Launch plan" },
    },
    {
      type: "tool-approval-request",
      approvalId: "approval-1",
      toolCallId: "call-1",
      signature: "e2e-signature",
    },
    { type: "finish-step" },
    { type: "finish" },
  ].map((chunk) => JSON.stringify(chunk));
  const resumeChunks = [
    { type: "start", messageId: "assistant-approval" },
    {
      type: "tool-output-available",
      toolCallId: "call-1",
      output: {
        fileName: "launch-plan.md",
        fileSize: 2048,
        url: "https://cdn.example.com/launch-plan.md",
      },
    },
    { type: "start-step" },
    { type: "text-start", id: "t1" },
    { type: "text-delta", id: "t1", delta: "Saved launch-plan.md." },
    { type: "text-end", id: "t1" },
    { type: "finish-step" },
    { type: "finish" },
  ].map((chunk) => JSON.stringify(chunk));

  await page.addInitScript(
    ({ approvalChunks, resumeChunks }) => {
      const originalFetch = window.fetch.bind(window);
      const requestBodies: string[] = [];
      (
        window as unknown as { __chatRequestBodies: string[] }
      ).__chatRequestBodies = requestBodies;

      window.fetch = async (input, init) => {
        const requestUrl = new URL(
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url,
          window.location.href,
        );
        if (requestUrl.pathname !== "/api/chat") {
          return originalFetch(input, init);
        }

        const rawBody =
          typeof init?.body === "string"
            ? init.body
            : input instanceof Request
              ? await input.clone().text()
              : "{}";
        requestBodies.push(rawBody);
        const chunks =
          requestBodies.length === 1 ? approvalChunks : resumeChunks;

        const encoder = new TextEncoder();
        return new Response(
          new ReadableStream({
            start(controller) {
              chunks.forEach((chunk) => {
                controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
              });
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            },
          }),
          {
            headers: {
              "content-type": "text/event-stream",
              "x-vercel-ai-ui-message-stream": "v1",
            },
          },
        );
      };
    },
    { approvalChunks, resumeChunks },
  );

  await page.goto("/dashboard/ai");
  await page
    .getByPlaceholder(/Ask, draft, or create/)
    .fill("Save the launch plan");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByText("Permission needed")).toBeVisible();
  await expect(
    page.getByText(
      'The assistant wants to run saveDocument on "launch-plan.md". This changes your data.',
    ),
  ).toBeVisible();

  await page.getByRole("button", { name: "Allow", exact: true }).click();

  await expect(page.getByText("Saved launch-plan.md.")).toBeVisible();
  // The saved file has to be reachable from the transcript, not just described.
  await expect(
    page.getByRole("link", { name: /launch-plan\.md/ }),
  ).toHaveAttribute("href", "https://cdn.example.com/launch-plan.md");
  await expect(page.getByText("Saved to your files · 2 KB")).toBeVisible();
  const secondBody = await page.evaluate(
    () =>
      (window as unknown as { __chatRequestBodies: string[] })
        .__chatRequestBodies[1],
  );
  // The resume must carry the granted approval; without it the server would
  // refuse to run the tool.
  expect(secondBody).toContain('"state":"approval-responded"');
  expect(secondBody).toContain('"approved":true');
});

test("uploads a reference image and enables an image-only message", async ({
  page,
}) => {
  await loginAs(page, "user");

  const publicUrl = "https://cdn.example.com/reference.png";
  const chatChunks = await createImageChatChunks(publicUrl);
  await page.addInitScript((chunks) => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
      const requestUrl = new URL(
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url,
        window.location.href,
      );
      if (requestUrl.pathname !== "/api/chat") {
        return originalFetch(input, init);
      }

      const encoder = new TextEncoder();
      return new Response(
        new ReadableStream({
          start(controller) {
            chunks.forEach((chunk) => {
              controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
            });
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        }),
        {
          headers: {
            "content-type": "text/event-stream",
            "x-vercel-ai-ui-message-stream": "v1",
          },
        },
      );
    };
  }, chatChunks);
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
  await page.getByRole("button", { name: "Send" }).click();

  const previewButton = page.getByRole("button", {
    name: "Preview reference.png",
  });
  await expect(previewButton).toBeVisible();
  await previewButton.click();
  const previewDialog = page.getByRole("dialog", { name: "reference.png" });
  await expect(previewDialog).toBeVisible();
  await expect(
    previewDialog.getByRole("img", { name: "reference.png" }),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(previewDialog).toBeHidden();
  await expect(previewButton).toBeFocused();
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
