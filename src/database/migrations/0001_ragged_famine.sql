ALTER TABLE "users" ADD COLUMN "banned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banReason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banExpires" timestamp;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "impersonatedBy" text;
