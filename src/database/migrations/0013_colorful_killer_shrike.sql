DROP INDEX "upload_intents_status_expiresAt_idx";--> statement-breakpoint
CREATE INDEX "upload_intents_cleanup_queue_idx" ON "upload_intents" USING btree ("status","cleanupAttempts","expiresAt");