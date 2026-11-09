CREATE TABLE "ai_stream_leases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
DROP INDEX "task_dispatches_pending_idx";--> statement-breakpoint
ALTER TABLE "task_dispatches" ADD COLUMN "retryAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN "deleteRetryAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ai_stream_leases" ADD CONSTRAINT "ai_stream_leases_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_stream_leases_userId_idx" ON "ai_stream_leases" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "ai_stream_leases_expiresAt_idx" ON "ai_stream_leases" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "uploads_delete_queue_idx" ON "uploads" USING btree (coalesce("deleteRetryAt", "deletedAt"),"id") WHERE "uploads"."deletedAt" is not null;--> statement-breakpoint
CREATE INDEX "task_dispatches_pending_idx" ON "task_dispatches" USING btree ("kind",coalesce("retryAt", "createdAt"),"id") WHERE "task_dispatches"."sentAt" is null;