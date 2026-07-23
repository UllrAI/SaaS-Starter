ALTER TABLE "webhook_events" DROP CONSTRAINT "webhook_events_eventId_unique";--> statement-breakpoint
DROP INDEX "webhook_events_eventId_idx";--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "lastWebhookCreatedAt" timestamp;--> statement-breakpoint
UPDATE "subscriptions" SET "lastWebhookCreatedAt" = "updatedAt" WHERE "lastWebhookCreatedAt" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_provider_eventId_unique" ON "webhook_events" USING btree ("provider","eventId");
