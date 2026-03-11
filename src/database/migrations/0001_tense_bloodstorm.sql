CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"keyPrefix" text NOT NULL,
	"keyHash" text NOT NULL,
	"lastFourChars" text NOT NULL,
	"rateLimit" integer DEFAULT 60 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"lastUsedAt" timestamp,
	"expiresAt" timestamp,
	"requestCountInWindow" integer DEFAULT 0 NOT NULL,
	"windowStartedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cli_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"tokenHash" text NOT NULL,
	"tokenPrefix" text NOT NULL,
	"lastFourChars" text NOT NULL,
	"refreshTokenHash" text NOT NULL,
	"previousRefreshTokenHash" text,
	"refreshRotatedAt" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"refreshExpiresAt" timestamp NOT NULL,
	"lastUsedAt" timestamp,
	"deviceOs" text,
	"deviceHostname" text,
	"cliVersion" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cli_tokens_tokenHash_unique" UNIQUE("tokenHash"),
	CONSTRAINT "cli_tokens_refreshTokenHash_unique" UNIQUE("refreshTokenHash")
);
--> statement-breakpoint
CREATE TABLE "device_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deviceCode" text NOT NULL,
	"userCode" text NOT NULL,
	"userId" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"interval" integer DEFAULT 5 NOT NULL,
	"lastPolledAt" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"clientName" text,
	"clientVersion" text,
	"deviceOs" text,
	"deviceHostname" text,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_codes_deviceCode_unique" UNIQUE("deviceCode"),
	CONSTRAINT "device_codes_userCode_unique" UNIQUE("userCode")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cli_tokens" ADD CONSTRAINT "cli_tokens_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_codes" ADD CONSTRAINT "device_codes_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_userId_idx" ON "api_keys" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "api_keys_keyHash_idx" ON "api_keys" USING btree ("keyHash");--> statement-breakpoint
CREATE INDEX "cli_tokens_userId_idx" ON "cli_tokens" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "device_codes_expiresAt_idx" ON "device_codes" USING btree ("expiresAt");