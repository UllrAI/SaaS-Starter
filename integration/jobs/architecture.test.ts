import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { createDatabaseClient } from "@/database/client";
import {
  users,
  aiConversations,
  aiMessages,
  aiRuns,
  aiUsageEvents,
  uploads,
  uploadIntents,
  subscriptions,
  payments,
} from "@/database/schema";
import { S3Client } from "@aws-sdk/client-s3";
import { createFileStorage } from "@/lib/uploads/store";
import { finalizeAiRun } from "@/lib/ai/finalize";
import {
  requestFileDeletion,
  cleanupDeletedFiles,
} from "@/lib/uploads/deletion";
import { hasCurrentSubscriptionAccess } from "@/lib/billing/access";
import type { AiMessage } from "@/lib/ai/chat-history-types";

const mockDatabase = createDatabaseClient({
  url: process.env.DATABASE_URL!,
  max: 5,
});
const mockEnv = { AI_DAILY_TOKEN_LIMIT: 800_000, AI_DAILY_IMAGE_LIMIT: 1 };
const mockSend = jest.spyOn(S3Client.prototype, "send");
jest.mock("server-only", () => ({}));
jest.mock("@/env", () => ({
  __esModule: true,
  get default() {
    return mockEnv;
  },
}));
jest.mock("@/database", () => ({
  get db() {
    return mockDatabase.db;
  },
}));
const userId = `architecture-${randomUUID()}`;
const otherId = `architecture-${randomUUID()}`;
let conversationId: string;
const storageConfig = {
  endpoint: "https://example.invalid",
  accessKeyId: "test",
  secretAccessKey: "test",
  bucketName: "private",
  UPLOAD_DAILY_QUOTA_BYTES: 1_000_000,
  UPLOAD_TOTAL_QUOTA_BYTES: 1_000_000,
};
const fileStorage = createFileStorage(mockDatabase.db, storageConfig);

beforeAll(async () => {
  await mockDatabase.db.insert(users).values(
    [userId, otherId].map((id) => ({
      id,
      name: "Architecture Test",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      email: `${id}@example.invalid`,
    })),
  );
  const [conversation] = await mockDatabase.db
    .insert(aiConversations)
    .values({ userId })
    .returning();
  conversationId = conversation.id;
});
afterAll(async () => {
  await mockDatabase.db.delete(users).where(eq(users.id, userId));
  await mockDatabase.db.delete(users).where(eq(users.id, otherId));
  await mockDatabase.close();
});

describe("architecture consistency against PostgreSQL", () => {
  it("migrates existing private file links with Unicode and reserved key characters", async () => {
    const migration = await readFile(
      "src/database/migrations/0025_shocking_blue_blade.sql",
      "utf8",
    );
    const dataMigration = migration.slice(
      migration.indexOf("-- Preserve existing files"),
    );
    await mockDatabase.sql.begin(async (tx) => {
      await tx`create temporary table uploads on commit drop as select * from public.uploads where false`;
      await tx`create temporary table ai_messages on commit drop as select * from public.ai_messages where false`;
      const key = "uploads/user/中文 a+b&c'd.webp";
      const publicUrl = "https://old-cdn.example/image.webp";
      await tx`insert into uploads (id, "fileKey", url) values (${randomUUID()}, ${key}, ${publicUrl})`;
      const parts = [
        { type: "file", url: publicUrl },
        { type: "tool-generateImage", output: { url: publicUrl } },
        { type: "text", text: "Unchanged" },
      ];
      await tx`insert into ai_messages (id, parts) values ('migration', ${JSON.stringify(parts)}::jsonb)`;
      await tx.unsafe(dataMigration);
      const [file] = await tx`select url from uploads`;
      const [message] = await tx`select parts from ai_messages`;
      expect(file.url).toBe(
        `/api/files/content?key=${encodeURIComponent(key)}`,
      );
      expect(message.parts[0].url).toBe(file.url);
      expect(message.parts[1].output.url).toBe(file.url);
      expect(message.parts[2]).toEqual(parts[2]);
    });
  });

  it("serializes AI admission, rejects repeated requests and retains unknown reservations", async () => {
    const { beginAiRun, failAiRun } = await import("@/lib/ai/runs");
    const input = {
      userId,
      conversationId,
      messages: [],
      parentMessageId: null,
      requestId: randomUUID(),
    };
    const results = await Promise.allSettled([
      beginAiRun(input),
      beginAiRun({ ...input, requestId: randomUUID() }),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const [run] = await mockDatabase.db
      .select()
      .from(aiRuns)
      .where(eq(aiRuns.userId, userId));
    await expect(
      beginAiRun({ ...input, requestId: run.requestKey }),
    ).rejects.toThrow(/already accepted/);
    await failAiRun(run.id, true);
    const next = await beginAiRun({ ...input, requestId: randomUUID() });
    expect(next.allowImageGeneration).toBe(false);
    await failAiRun(next.run.id, true);
    await expect(
      beginAiRun({ ...input, requestId: randomUUID() }),
    ).rejects.toThrow(/allowance/);
    await mockDatabase.db.delete(aiRuns).where(eq(aiRuns.userId, userId));
  });

  it("retains image allowance when completion usage is unknown", async () => {
    const { beginAiRun, completeAiRun } = await import("@/lib/ai/runs");
    const { run } = await beginAiRun({
      userId,
      conversationId,
      messages: [],
      parentMessageId: null,
      requestId: randomUUID(),
    });
    await completeAiRun(
      run.id,
      { id: "unknown-response", role: "assistant", parts: [] },
      {
        userId,
        conversationId,
        messageId: "unknown-response",
        agentId: "assistant",
        model: "unreported",
        reasoningEffort: "low",
      },
    );
    const [stored] = await mockDatabase.db
      .select()
      .from(aiRuns)
      .where(eq(aiRuns.id, run.id));
    expect(stored.totalTokens).toBeNull();
    expect(stored.imageCount).toBe(1);
    await mockDatabase.db.delete(aiRuns).where(eq(aiRuns.id, run.id));
  });

  it("stores output and accounting before media work, and a stale retry cannot overwrite a newer reply", async () => {
    const { beginAiRun, completeAiRun } = await import("@/lib/ai/runs");
    const { run } = await beginAiRun({
      userId,
      conversationId,
      messages: [],
      parentMessageId: null,
      requestId: randomUUID(),
    });
    const message: AiMessage = {
      id: "a-media",
      role: "assistant",
      parts: [
        {
          type: "tool-generateImage",
          toolCallId: "img-1",
          state: "output-available",
          input: {},
          output: { result: Buffer.from("image").toString("base64") },
        },
      ],
    };
    const usage = {
      userId,
      conversationId,
      messageId: message.id,
      agentId: "assistant",
      model: "test",
      reasoningEffort: "low" as const,
      totalTokens: 100,
    };
    await completeAiRun(run.id, message, usage);
    const brokenStorage = jest
      .fn<typeof fileStorage>()
      .mockRejectedValue(new Error("R2 offline"));
    await expect(
      finalizeAiRun(mockDatabase.db, run.id, brokenStorage),
    ).rejects.toThrow("R2 offline");
    const [stored] = await mockDatabase.db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.id, message.id));
    expect(stored.parts).toEqual([
      expect.objectContaining({ output: { storageStatus: "pending" } }),
    ]);
    expect(
      await mockDatabase.db
        .select()
        .from(aiUsageEvents)
        .where(eq(aiUsageEvents.runId, run.id)),
    ).toHaveLength(1);
    const newer = await beginAiRun({
      userId,
      conversationId,
      messages: [],
      parentMessageId: message.id,
      requestId: randomUUID(),
    });
    const newerMessage: AiMessage = {
      id: message.id,
      role: "assistant",
      parts: [{ type: "text", text: "newer continuation" }],
    };
    await completeAiRun(newer.run.id, newerMessage, usage);
    mockSend.mockResolvedValue({});
    await Promise.all([
      finalizeAiRun(mockDatabase.db, run.id, fileStorage),
      finalizeAiRun(mockDatabase.db, run.id, fileStorage),
    ]);
    const [latest] = await mockDatabase.db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.id, message.id));
    expect(latest.parts).toEqual(newerMessage.parts);
    expect(
      await mockDatabase.db
        .select()
        .from(aiUsageEvents)
        .where(eq(aiUsageEvents.runId, run.id)),
    ).toHaveLength(1);
  });

  it("recovers an uncertain object PUT without a duplicate record or quota charge", async () => {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    let uploaded = false;
    mockSend.mockImplementation(async (command: unknown) => {
      if (command instanceof PutObjectCommand) {
        if (!uploaded) {
          uploaded = true;
          throw new Error("connection lost after successful PUT");
        }
        throw Object.assign(new Error("Exists"), {
          $metadata: { httpStatusCode: 412 },
        });
      }
      return { ContentLength: 5, ContentType: "text/markdown" };
    });
    const input = {
      userId,
      identity: "document:conversation:call-1",
      fileName: "notes.md",
      contentType: "text/markdown",
      body: Buffer.from("notes"),
    };
    await expect(fileStorage(input)).rejects.toThrow(/connection lost/);
    const [first, second] = await Promise.all([
      fileStorage(input),
      fileStorage(input),
    ]);
    expect(first.id).toBe(second.id);
    expect(first.url).toMatch(/^\/api\/files\/content\?key=/);
    expect(
      await mockDatabase.db
        .select()
        .from(uploads)
        .where(
          and(eq(uploads.userId, userId), eq(uploads.fileName, "notes.md")),
        ),
    ).toHaveLength(1);
    expect(
      await requestFileDeletion(mockDatabase.db, [first.id], {
        id: otherId,
        role: "user",
      }),
    ).toEqual([]);
    expect(
      await requestFileDeletion(mockDatabase.db, [first.id], {
        id: userId,
        role: "user",
      }),
    ).toHaveLength(1);
    await expect(fileStorage(input)).rejects.toThrow(
      "This saved file was deleted.",
    );
    await cleanupDeletedFiles(mockDatabase.db, async () => ({
      success: false,
    }));
    expect(
      await mockDatabase.db
        .select()
        .from(uploads)
        .where(eq(uploads.id, first.id)),
    ).toHaveLength(1);
    await cleanupDeletedFiles(mockDatabase.db, async () => ({ success: true }));
    expect(
      await mockDatabase.db
        .select()
        .from(uploads)
        .where(eq(uploads.id, first.id)),
    ).toHaveLength(0);
    const calls = mockSend.mock.calls.length;
    await expect(fileStorage(input)).rejects.toThrow(
      "This saved file was deleted.",
    );
    expect(mockSend.mock.calls).toHaveLength(calls);
  });

  it("renews expired save reservations without reusing objects awaiting cleanup", async () => {
    const input = {
      userId,
      identity: "expired-save",
      fileName: "expired.md",
      contentType: "text/markdown",
      body: Buffer.from("retry"),
    };
    mockSend.mockRejectedValue(new Error("storage unavailable"));
    await expect(fileStorage(input)).rejects.toThrow("storage unavailable");
    const [expired] = await mockDatabase.db
      .select()
      .from(uploadIntents)
      .where(
        and(
          eq(uploadIntents.userId, userId),
          eq(uploadIntents.fileName, input.fileName),
        ),
      );
    await mockDatabase.db
      .update(uploadIntents)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(uploadIntents.id, expired.id));
    mockSend.mockResolvedValue({});
    const saved = await fileStorage(input);
    expect(saved.fileKey).not.toBe(expired.fileKey);
    const [old] = await mockDatabase.db
      .select()
      .from(uploadIntents)
      .where(eq(uploadIntents.id, expired.id));
    expect(old.status).toBe("cancelled");
    expect((await fileStorage(input)).id).toBe(saved.id);
    expect(
      await mockDatabase.db
        .select()
        .from(uploads)
        .where(
          and(eq(uploads.userId, userId), eq(uploads.fileName, input.fileName)),
        ),
    ).toHaveLength(1);
  });

  it("provider status refresh cannot clear independent disputed payments", async () => {
    const { getUserSubscription } = await import("@/lib/database/subscription");
    const subscriptionId = `sub_${randomUUID()}`;
    await mockDatabase.db.insert(subscriptions).values({
      userId,
      customerId: "cus_test",
      subscriptionId,
      productId: "pro",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 86_400_000),
    });
    const [payment] = await mockDatabase.db
      .insert(payments)
      .values({
        userId,
        paymentId: `pi_${randomUUID()}`,
        subscriptionId,
        amount: 100,
        currency: "usd",
        customerId: "cus_test",
        status: "disputed",
        productId: "pro",
        paymentType: "subscription",
      })
      .returning();
    expect(
      hasCurrentSubscriptionAccess(await getUserSubscription(userId)),
    ).toBe(false);
    await mockDatabase.db
      .update(subscriptions)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(subscriptions.subscriptionId, subscriptionId));
    expect(
      hasCurrentSubscriptionAccess(await getUserSubscription(userId)),
    ).toBe(false);
    await mockDatabase.db
      .update(payments)
      .set({ status: "succeeded" })
      .where(eq(payments.id, payment.id));
    expect(
      hasCurrentSubscriptionAccess(await getUserSubscription(userId)),
    ).toBe(true);
  });
});
