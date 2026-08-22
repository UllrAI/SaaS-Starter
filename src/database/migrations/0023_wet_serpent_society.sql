CREATE TYPE "public"."task_run_status" AS ENUM('queued', 'running', 'waiting', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "task_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"status" "task_run_status" DEFAULT 'queued' NOT NULL,
	"scopeKey" text NOT NULL,
	"idempotencyKey" text,
	"progress" jsonb,
	"input" jsonb,
	"result" jsonb,
	"error" jsonb,
	"providerJobId" text,
	"startedAt" timestamp with time zone,
	"completedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "task_runs_scopeKey_createdAt_idx" ON "task_runs" USING btree ("scopeKey","createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "task_runs_status_updatedAt_idx" ON "task_runs" USING btree ("status","updatedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "task_runs_scopeKey_kind_idempotencyKey_unique" ON "task_runs" USING btree ("scopeKey","kind","idempotencyKey") WHERE "task_runs"."idempotencyKey" is not null;