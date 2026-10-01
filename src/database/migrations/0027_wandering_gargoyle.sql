ALTER TABLE "ai_runs" ADD COLUMN "accountingStatus" text DEFAULT 'unreported' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "accountingFailures" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "accountingRetryAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD COLUMN "aborted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD COLUMN "usageComplete" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD COLUMN "imageAttempts" integer;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD COLUMN "generatedImages" integer;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD COLUMN "imageSize" text;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD COLUMN "estimatedImageOutputCostMicrousd" integer;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD COLUMN "imageCostBasis" text;--> statement-breakpoint
-- Recover rows accepted before this release without pretending old usage is new.
UPDATE "ai_runs" r SET "accountingStatus" = CASE
  WHEN EXISTS (SELECT 1 FROM "ai_usage_events" u WHERE u."runId" = r.id) THEN 'recorded'
  WHEN r.usage IS NOT NULL THEN 'pending'
  ELSE 'unreported'
END;--> statement-breakpoint
-- Guard upgrades from inconsistent legacy active rows before adding constraints.
WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY "userId" ORDER BY "createdAt" DESC, id DESC) AS n
  FROM "ai_runs" WHERE status = 'running'
)
UPDATE "ai_runs" SET status = 'interrupted' WHERE id IN (SELECT id FROM ranked WHERE n > 1);--> statement-breakpoint
CREATE UNIQUE INDEX "ai_runs_active_user_unique" ON "ai_runs" USING btree ("userId") WHERE "ai_runs"."status" = 'running';--> statement-breakpoint
CREATE UNIQUE INDEX "ai_runs_active_conversation_unique" ON "ai_runs" USING btree ("conversationId") WHERE "ai_runs"."status" = 'running';