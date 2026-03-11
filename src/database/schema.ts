import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  uuid,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

// 定义用户角色枚举
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

export const sessions = pgTable("sessions", {
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
});

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
    requestCountInWindow: integer("requestCountInWindow")
      .notNull()
      .default(0),
    windowStartedAt: timestamp("windowStartedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => {
    return {
      userIdx: index("api_keys_userId_idx").on(table.userId),
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
    previousRefreshTokenHash: text("previousRefreshTokenHash"),
    refreshRotatedAt: timestamp("refreshRotatedAt"),
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
      userIdx: index("cli_tokens_userId_idx").on(table.userId),
    };
  },
);

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

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
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => {
    return {
      userIdx: index("subscriptions_userId_idx").on(table.userId),
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
      userIdx: index("payments_userId_idx").on(table.userId),
    };
  },
);

// Webhook events table to ensure idempotency
export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: text("eventId").notNull().unique(), // Unique identifier from webhook provider
    eventType: text("eventType").notNull(),
    provider: text("provider").notNull().default("creem"), // Support multiple providers
    processed: boolean("processed").notNull().default(true),
    processedAt: timestamp("processedAt").notNull().defaultNow(),
    payload: text("payload"), // Store original payload for debugging
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => {
    return {
      eventIdIdx: index("webhook_events_eventId_idx").on(table.eventId),
      providerIdx: index("webhook_events_provider_idx").on(table.provider),
    };
  },
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
      userIdx: index("uploads_userId_idx").on(table.userId),
      fileKeyIdx: index("uploads_fileKey_idx").on(table.fileKey),
    };
  },
);
