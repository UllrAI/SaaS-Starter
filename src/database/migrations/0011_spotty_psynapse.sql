CREATE TYPE "public"."upload_intent_status" AS ENUM('pending', 'cleaning', 'completed');--> statement-breakpoint
CREATE TABLE "upload_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"fileKey" text NOT NULL,
	"fileName" text NOT NULL,
	"fileSize" integer NOT NULL,
	"contentType" text NOT NULL,
	"status" "upload_intent_status" DEFAULT 'pending' NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"completedAt" timestamp with time zone,
	"cleanupAttempts" integer DEFAULT 0 NOT NULL,
	"lastCleanupError" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN "uploadIntentId" uuid;--> statement-breakpoint
ALTER TABLE "upload_intents" ADD CONSTRAINT "upload_intents_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "upload_intents_fileKey_unique" ON "upload_intents" USING btree ("fileKey");--> statement-breakpoint
CREATE INDEX "upload_intents_userId_status_expiresAt_idx" ON "upload_intents" USING btree ("userId","status","expiresAt");--> statement-breakpoint
CREATE INDEX "upload_intents_status_expiresAt_idx" ON "upload_intents" USING btree ("status","expiresAt");--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_uploadIntentId_upload_intents_id_fk" FOREIGN KEY ("uploadIntentId") REFERENCES "public"."upload_intents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uploads_uploadIntentId_unique" ON "uploads" USING btree ("uploadIntentId");