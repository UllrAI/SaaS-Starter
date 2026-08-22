DROP INDEX "ai_conversations_userId_updatedAt_idx";--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD COLUMN "archivedAt" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "ai_conversations_userId_archivedAt_updatedAt_idx" ON "ai_conversations" USING btree ("userId","archivedAt","updatedAt" DESC NULLS LAST);