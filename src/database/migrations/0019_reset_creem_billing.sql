-- The reference deployment is a demo. Creem records cannot be managed or
-- reconciled by Stripe, so reset every provider-owned billing table before
-- accepting Stripe events. Users and their roles are intentionally preserved.
DELETE FROM "product_entitlements";
DELETE FROM "payments";
DELETE FROM "subscriptions";
DELETE FROM "webhook_events";

UPDATE "users"
SET "paymentProviderCustomerId" = NULL
WHERE "paymentProviderCustomerId" IS NOT NULL;

ALTER TABLE "webhook_events"
ALTER COLUMN "provider" SET DEFAULT 'stripe';
