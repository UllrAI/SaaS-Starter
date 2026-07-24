CREATE TABLE "rate_limit_buckets" (
	"scope" text NOT NULL,
	"keyHash" text NOT NULL,
	"count" integer NOT NULL,
	"resetAt" timestamp NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limit_buckets_scope_keyHash_pk" PRIMARY KEY("scope","keyHash")
);
--> statement-breakpoint
CREATE INDEX "rate_limit_buckets_resetAt_idx" ON "rate_limit_buckets" USING btree ("resetAt");