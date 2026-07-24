ALTER TYPE "public"."upload_intent_status" ADD VALUE 'cancelled' BEFORE 'cleaning';--> statement-breakpoint
ALTER TABLE "upload_intents" ADD COLUMN "deleteCheckedAt" timestamp with time zone;--> statement-breakpoint
UPDATE "payments" SET "currency" = lower("currency") WHERE "currency" <> lower("currency");--> statement-breakpoint
CREATE INDEX "payments_status_currency_createdAt_idx" ON "payments" USING btree ("status","currency","createdAt" DESC NULLS LAST);
