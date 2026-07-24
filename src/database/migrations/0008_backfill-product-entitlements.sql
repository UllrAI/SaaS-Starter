INSERT INTO "product_entitlements" (
  "userId",
  "productId",
  "sourcePaymentId",
  "createdAt"
)
SELECT
  latest_payment."userId",
  latest_payment."productId",
  latest_payment."paymentId",
  latest_payment."createdAt"
FROM (
  SELECT DISTINCT ON ("userId", "productId")
    "userId",
    "productId",
    "paymentId",
    "createdAt"
  FROM "payments"
  WHERE
    "status" = 'succeeded'
    AND "paymentType" = 'one_time'
    AND "productId" IN ('plus', 'pro', 'team')
  ORDER BY "userId", "productId", "createdAt" DESC, "paymentId" DESC
) AS latest_payment
ON CONFLICT ("userId", "productId") DO NOTHING;
