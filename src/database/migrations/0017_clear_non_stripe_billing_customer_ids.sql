-- Custom SQL migration file, put your code below! --

-- Billing moved from Creem to Stripe. Any customer ID left over from Creem is
-- not a valid Stripe customer, and passing it to Checkout fails the request.
-- Clearing it lets the next checkout create a Stripe customer for that user.
UPDATE "users"
SET "paymentProviderCustomerId" = NULL
WHERE "paymentProviderCustomerId" IS NOT NULL
  AND "paymentProviderCustomerId" NOT LIKE 'cus\_%';
