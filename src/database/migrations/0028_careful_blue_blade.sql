CREATE TABLE "ai_run_events" (
	"runId" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"chunk" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_run_events_runId_sequence_pk" PRIMARY KEY("runId","sequence")
);
--> statement-breakpoint
DROP INDEX "ai_runs_active_user_unique";--> statement-breakpoint
DROP INDEX "ai_runs_active_conversation_unique";--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "taskRunId" uuid;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "assistantMessageId" text;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "input" jsonb;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "providerStartedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "cancelRequestedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "lastEventId" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_run_events" ADD CONSTRAINT "ai_run_events_runId_ai_runs_id_fk" FOREIGN KEY ("runId") REFERENCES "public"."ai_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD CONSTRAINT "ai_runs_taskRunId_task_runs_id_fk" FOREIGN KEY ("taskRunId") REFERENCES "public"."task_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_runs_active_user_unique" ON "ai_runs" USING btree ("userId") WHERE "ai_runs"."status" in ('queued', 'running');--> statement-breakpoint
CREATE UNIQUE INDEX "ai_runs_active_conversation_unique" ON "ai_runs" USING btree ("conversationId") WHERE "ai_runs"."status" in ('queued', 'running');
--> statement-breakpoint
-- Existing Web-owned runs may already have invoked a paid provider. Their
-- missing invocation marker must not be mistaken for a never-started task.
UPDATE "ai_runs" SET "providerStartedAt" = "createdAt" WHERE "status" = 'running';
