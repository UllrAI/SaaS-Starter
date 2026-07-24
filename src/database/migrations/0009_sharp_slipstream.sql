ALTER TABLE "product_entitlements" ADD COLUMN "revokedAt" timestamp;--> statement-breakpoint
ALTER TABLE "product_entitlements" ADD COLUMN "revocationReason" text;