import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  uuid,
  index,
  uniqueIndex,
  pgEnum,
  primaryKey,
  foreignKey,
  check,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "user",
  "admin",
  "super_admin",
]);

export const uploadIntentStatusEnum = pgEnum("upload_intent_status", [
  "pending",
  "cancelled",
  "cleaning",
  "completed",
]);

export const aiMessageRoleEnum = pgEnum("ai_message_role", [
  "system",
  "user",
  "assistant",
]);

export const taskRunStatusEnum = pgEnum("task_run_status", [
  "queued",
  "running",
  "waiting",
  "completed",
  "failed",
  "cancelled",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("user"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires"),
  paymentProviderCustomerId: text("paymentProviderCustomerId").unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    impersonatedBy: text("impersonatedBy"),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => ({
    userIdx: index("sessions_userId_idx").on(table.userId),
  }),
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
  },
  (table) => {
    return {
      userIdx: index("accounts_userId_idx").on(table.userId),
    };
  },
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyPrefix: text("keyPrefix").notNull(),
    keyHash: text("keyHash").notNull(),
    lastFourChars: text("lastFourChars").notNull(),
    rateLimit: integer("rateLimit").notNull().default(60),
    isActive: boolean("isActive").notNull().default(true),
    lastUsedAt: timestamp("lastUsedAt"),
    expiresAt: timestamp("expiresAt"),
    requestCountInWindow: integer("requestCountInWindow").notNull().default(0),
    windowStartedAt: timestamp("windowStartedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => {
    return {
      userCreatedAtIdx: index("api_keys_userId_createdAt_idx").on(
        table.userId,
        table.createdAt.desc(),
      ),
      keyHashIdx: index("api_keys_keyHash_idx").on(table.keyHash),
    };
  },
);

export const deviceCodes = pgTable(
  "device_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deviceCode: text("deviceCode").notNull().unique(),
    userCode: text("userCode").notNull().unique(),
    userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    interval: integer("interval").notNull().default(5),
    lastPolledAt: timestamp("lastPolledAt"),
    attempts: integer("attempts").notNull().default(0),
    clientName: text("clientName"),
    clientVersion: text("clientVersion"),
    deviceOs: text("deviceOs"),
    deviceHostname: text("deviceHostname"),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => {
    return {
      expiresAtIdx: index("device_codes_expiresAt_idx").on(table.expiresAt),
    };
  },
);

export const cliTokens = pgTable(
  "cli_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("tokenHash").notNull().unique(),
    tokenPrefix: text("tokenPrefix").notNull(),
    lastFourChars: text("lastFourChars").notNull(),
    refreshTokenHash: text("refreshTokenHash").notNull().unique(),
    isActive: boolean("isActive").notNull().default(true),
    expiresAt: timestamp("expiresAt").notNull(),
    refreshExpiresAt: timestamp("refreshExpiresAt").notNull(),
    lastUsedAt: timestamp("lastUsedAt"),
    deviceOs: text("deviceOs"),
    deviceHostname: text("deviceHostname"),
    cliVersion: text("cliVersion"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => {
    return {
      userCreatedAtIdx: index("cli_tokens_userId_createdAt_idx").on(
        table.userId,
        table.createdAt.desc(),
      ),
    };
  },
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt"),
    updatedAt: timestamp("updatedAt"),
  },
  (table) => ({
    identifierIdx: index("verifications_identifier_idx").on(table.identifier),
  }),
);

// Subscription table to store user subscription information
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    customerId: text("customerId").notNull(),
    subscriptionId: text("subscriptionId").notNull().unique(),
    productId: text("productId").notNull(),
    status: text("status").notNull(),
    currentPeriodStart: timestamp("currentPeriodStart"),
    currentPeriodEnd: timestamp("currentPeriodEnd"),
    canceledAt: timestamp("canceledAt"),
    lastWebhookCreatedAt: timestamp("lastWebhookCreatedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => {
    return {
      userCreatedAtIdx: index("subscriptions_userId_createdAt_idx").on(
        table.userId,
        table.createdAt.desc(),
      ),
      customerIdIdx: index("subscriptions_customerId_idx").on(table.customerId),
    };
  },
);

// Payment records table to store payment history
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    customerId: text("customerId").notNull(),
    subscriptionId: text("subscriptionId"),
    productId: text("productId").notNull(),
    paymentId: text("paymentId").notNull().unique(),
    paymentIntentId: text("paymentIntentId"),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("usd"),
    status: text("status").notNull(),
    paymentType: text("paymentType").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => {
    return {
      userCreatedAtIdx: index("payments_userId_createdAt_idx").on(
        table.userId,
        table.createdAt.desc(),
      ),
      settledCurrencyCreatedAtIdx: index(
        "payments_status_currency_createdAt_idx",
      ).on(table.status, table.currency, table.createdAt.desc()),
      paymentIntentIdUnique: uniqueIndex("payments_paymentIntentId_unique").on(
        table.paymentIntentId,
      ),
      paymentOwnerProductUnique: uniqueIndex(
        "payments_paymentId_userId_productId_unique",
      ).on(table.paymentId, table.userId, table.productId),
    };
  },
);

export const productEntitlements = pgTable(
  "product_entitlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("productId").notNull(),
    sourcePaymentId: text("sourcePaymentId").notNull(),
    revokedAt: timestamp("revokedAt"),
    revocationReason: text("revocationReason"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    userProductUnique: uniqueIndex(
      "product_entitlements_userId_productId_unique",
    ).on(table.userId, table.productId),
    sourcePaymentUnique: uniqueIndex(
      "product_entitlements_sourcePaymentId_unique",
    ).on(table.sourcePaymentId),
    userCreatedAtIdx: index("product_entitlements_userId_createdAt_idx").on(
      table.userId,
      table.createdAt.desc(),
    ),
    paymentOwnerProductFk: foreignKey({
      columns: [table.sourcePaymentId, table.userId, table.productId],
      foreignColumns: [payments.paymentId, payments.userId, payments.productId],
      name: "product_entitlements_payment_owner_product_fk",
    }),
  }),
);

// Successfully processed provider events retained for idempotency
export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: text("eventId").notNull(),
    eventType: text("eventType").notNull(),
    provider: text("provider").notNull().default("stripe"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => {
    return {
      providerEventIdUnique: uniqueIndex(
        "webhook_events_provider_eventId_unique",
      ).on(table.provider, table.eventId),
      providerIdx: index("webhook_events_provider_idx").on(table.provider),
    };
  },
);

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    scope: text("scope").notNull(),
    keyHash: text("keyHash").notNull(),
    count: integer("count").notNull(),
    resetAt: timestamp("resetAt", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.scope, table.keyHash] }),
    resetAtIdx: index("rate_limit_buckets_resetAt_idx").on(table.resetAt),
  }),
);

export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title"),
    archivedAt: timestamp("archivedAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userArchivedAtUpdatedAtIdx: index(
      "ai_conversations_userId_archivedAt_updatedAt_idx",
    ).on(table.userId, table.archivedAt, table.updatedAt.desc()),
  }),
);

export const aiMessages = pgTable(
  "ai_messages",
  {
    id: text("id").notNull(),
    conversationId: uuid("conversationId")
      .notNull()
      .references(() => aiConversations.id, { onDelete: "cascade" }),
    role: aiMessageRoleEnum("role").notNull(),
    parts: jsonb("parts").$type<unknown[]>().notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.conversationId, table.id] }),
    idNotEmpty: check("ai_messages_id_not_empty", sql`length(${table.id}) > 0`),
    conversationCreatedAtIdx: index(
      "ai_messages_conversationId_createdAt_idx",
    ).on(table.conversationId, table.createdAt),
  }),
);

/**
 * One row per completed assistant turn. Token columns stay nullable because a
 * provider may omit any of them; storing 0 for "unknown" would silently
 * understate cost once these rows drive billing or quota decisions.
 */
export const aiUsageEvents = pgTable(
  "ai_usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conversationId: uuid("conversationId")
      .notNull()
      .references(() => aiConversations.id, { onDelete: "cascade" }),
    messageId: text("messageId").notNull(),
    agentId: text("agentId").notNull(),
    model: text("model").notNull(),
    reasoningEffort: text("reasoningEffort").notNull(),
    inputTokens: integer("inputTokens"),
    cacheReadTokens: integer("cacheReadTokens"),
    cacheWriteTokens: integer("cacheWriteTokens"),
    outputTokens: integer("outputTokens"),
    reasoningTokens: integer("reasoningTokens"),
    totalTokens: integer("totalTokens"),
    finishReason: text("finishReason"),
    aborted: boolean("aborted").notNull().default(false),
    durationMs: integer("durationMs"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userCreatedAtIdx: index("ai_usage_events_userId_createdAt_idx").on(
      table.userId,
      table.createdAt.desc(),
    ),
    conversationIdx: index("ai_usage_events_conversationId_idx").on(
      table.conversationId,
    ),
  }),
);

export const taskRuns = pgTable(
  "task_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    status: taskRunStatusEnum("status").notNull().default("queued"),
    scopeKey: text("scopeKey").notNull(),
    idempotencyKey: text("idempotencyKey"),
    progress: jsonb("progress").$type<Record<string, unknown> | null>(),
    input: jsonb("input").$type<unknown>(),
    result: jsonb("result").$type<unknown>(),
    error: jsonb("error").$type<{
      code: string;
      message: string;
      retryable: boolean;
      attempt: number;
    } | null>(),
    providerJobId: text("providerJobId"),
    startedAt: timestamp("startedAt", { withTimezone: true }),
    completedAt: timestamp("completedAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    scopeCreatedAtIdx: index("task_runs_scopeKey_createdAt_idx").on(
      table.scopeKey,
      table.createdAt.desc(),
    ),
    statusUpdatedAtIdx: index("task_runs_status_updatedAt_idx").on(
      table.status,
      table.updatedAt,
    ),
    scopeKindIdempotencyUnique: uniqueIndex(
      "task_runs_scopeKey_kind_idempotencyKey_unique",
    )
      .on(table.scopeKey, table.kind, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  }),
);

export const uploadIntents = pgTable(
  "upload_intents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fileKey: text("fileKey").notNull(),
    fileName: text("fileName").notNull(),
    fileSize: integer("fileSize").notNull(),
    contentType: text("contentType").notNull(),
    status: uploadIntentStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    completedAt: timestamp("completedAt", { withTimezone: true }),
    deleteCheckedAt: timestamp("deleteCheckedAt", { withTimezone: true }),
    cleanupAttempts: integer("cleanupAttempts").notNull().default(0),
    lastCleanupError: text("lastCleanupError"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    fileSizePositive: check(
      "upload_intents_fileSize_positive",
      sql`${table.fileSize} > 0`,
    ),
    cleanupAttemptsNonNegative: check(
      "upload_intents_cleanupAttempts_non_negative",
      sql`${table.cleanupAttempts} >= 0`,
    ),
    fileKeyUnique: uniqueIndex("upload_intents_fileKey_unique").on(
      table.fileKey,
    ),
    userStatusExpiresAtIdx: index(
      "upload_intents_userId_status_expiresAt_idx",
    ).on(table.userId, table.status, table.expiresAt),
    cleanupIdx: index("upload_intents_cleanup_queue_idx").on(
      table.status,
      table.cleanupAttempts,
      table.expiresAt,
    ),
  }),
);

// File uploads table to store uploaded file metadata
export const uploads = pgTable(
  "uploads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    uploadIntentId: uuid("uploadIntentId").references(() => uploadIntents.id, {
      onDelete: "set null",
    }),
    fileKey: text("fileKey").notNull(), // Key in R2 storage
    url: text("url").notNull(), // Public access URL
    fileName: text("fileName").notNull(), // Original file name
    fileSize: integer("fileSize").notNull(), // File size in bytes
    contentType: text("contentType").notNull(), // MIME type
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => {
    return {
      userCreatedAtIdx: index("uploads_userId_createdAt_idx").on(
        table.userId,
        table.createdAt.desc(),
      ),
      uploadIntentUnique: uniqueIndex("uploads_uploadIntentId_unique").on(
        table.uploadIntentId,
      ),
      fileSizePositive: check(
        "uploads_fileSize_positive",
        sql`${table.fileSize} > 0`,
      ),
      fileKeyUnique: uniqueIndex("uploads_fileKey_unique").on(table.fileKey),
    };
  },
);
