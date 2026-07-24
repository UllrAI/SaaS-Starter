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
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "user",
  "admin",
  "super_admin",
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
    // Pre-parsed userAgent fields for performance optimization
    os: text("os"),
    browser: text("browser"),
    deviceType: text("deviceType"),
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

// Webhook events table to ensure idempotency
export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: text("eventId").notNull(), // Unique identifier from webhook provider
    eventType: text("eventType").notNull(),
    provider: text("provider").notNull().default("creem"), // Support multiple providers
    processed: boolean("processed").notNull().default(true),
    processedAt: timestamp("processedAt").notNull().defaultNow(),
    payload: text("payload"), // Store original payload for debugging
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

// File uploads table to store uploaded file metadata
export const uploads = pgTable(
  "uploads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
      fileKeyUnique: uniqueIndex("uploads_fileKey_unique").on(table.fileKey),
    };
  },
);
