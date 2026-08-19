-- Custom SQL migration file, put your code below! --

-- Clear billing customer values that cannot be used by Stripe.
UPDATE "users"
SET "paymentProviderCustomerId" = NULL
WHERE "paymentProviderCustomerId" IS NOT NULL
  AND "paymentProviderCustomerId" NOT LIKE 'cus\_%';
