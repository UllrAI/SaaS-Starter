CREATE TABLE "ai_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"conversationId" uuid NOT NULL,
	"requestKey" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"reservedTokens" integer NOT NULL,
	"totalTokens" integer,
	"imageCount" integer DEFAULT 0 NOT NULL,
	"response" jsonb,
	"usage" jsonb,
	"finalizedAt" timestamp with time zone,
	"finalizationRetryAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_dispatches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"taskRunId" uuid NOT NULL,
	"kind" text NOT NULL,
	"scopeKey" text NOT NULL,
	"payload" jsonb NOT NULL,
	"startAfter" timestamp with time zone DEFAULT now() NOT NULL,
	"sentAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_messages" ADD COLUMN "runId" uuid;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD COLUMN "runId" uuid;--> statement-breakpoint
ALTER TABLE "task_runs" ADD COLUMN "dispatchId" uuid;--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN "deletedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD CONSTRAINT "ai_runs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD CONSTRAINT "ai_runs_conversationId_ai_conversations_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dispatches" ADD CONSTRAINT "task_dispatches_taskRunId_task_runs_id_fk" FOREIGN KEY ("taskRunId") REFERENCES "public"."task_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_runs_conversation_request_unique" ON "ai_runs" USING btree ("conversationId","requestKey");--> statement-breakpoint
CREATE INDEX "ai_runs_user_created_idx" ON "ai_runs" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "ai_runs_pending_idx" ON "ai_runs" USING btree ("status","createdAt");--> statement-breakpoint
CREATE INDEX "task_dispatches_pending_idx" ON "task_dispatches" USING btree ("kind","createdAt") WHERE "task_dispatches"."sentAt" is null;--> statement-breakpoint
CREATE INDEX "task_dispatches_taskRunId_idx" ON "task_dispatches" USING btree ("taskRunId");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_usage_events_runId_unique" ON "ai_usage_events" USING btree ("runId");--> statement-breakpoint
-- Preserve existing files and historical AI links while removing public URLs.
CREATE FUNCTION pg_temp.file_url(key text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT '/api/files/content?key=' || coalesce(string_agg(
    CASE WHEN chr(get_byte(convert_to(key, 'UTF8'), i)) ~ '^[A-Za-z0-9_.!~*''()-]$'
      THEN chr(get_byte(convert_to(key, 'UTF8'), i))
      ELSE '%' || upper(lpad(to_hex(get_byte(convert_to(key, 'UTF8'), i)), 2, '0')) END,
    '' ORDER BY i), '')
  FROM generate_series(0, octet_length(key) - 1) AS i
$$;
--> statement-breakpoint
UPDATE ai_messages AS message SET parts = (
  SELECT coalesce(jsonb_agg(
    CASE WHEN part->>'type' = 'file' AND file_upload.id IS NOT NULL
      THEN jsonb_set(part, '{url}', to_jsonb(pg_temp.file_url(file_upload."fileKey")))
      WHEN output_upload.id IS NOT NULL
      THEN jsonb_set(part, '{output,url}', to_jsonb(pg_temp.file_url(output_upload."fileKey")))
      ELSE part END ORDER BY position), '[]'::jsonb)
  FROM jsonb_array_elements(message.parts) WITH ORDINALITY AS entry(part, position)
  LEFT JOIN uploads file_upload ON file_upload.url = part->>'url'
  LEFT JOIN uploads output_upload ON output_upload.url = part->'output'->>'url'
);
--> statement-breakpoint
UPDATE uploads SET url = pg_temp.file_url("fileKey");
--> statement-breakpoint
DROP FUNCTION pg_temp.file_url(text);
