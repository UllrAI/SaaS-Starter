CREATE TABLE "rate_limit_buckets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" text NOT NULL,
	"key" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"windowStartedAt" timestamp NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limit_buckets_scope_key_idx" ON "rate_limit_buckets" USING btree ("scope","key");--> statement-breakpoint
CREATE INDEX "rate_limit_buckets_windowStartedAt_idx" ON "rate_limit_buckets" USING btree ("windowStartedAt");