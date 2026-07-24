ALTER TABLE "product_entitlements" DROP CONSTRAINT "product_entitlements_sourcePaymentId_payments_paymentId_fk";
--> statement-breakpoint
CREATE UNIQUE INDEX "payments_paymentId_userId_productId_unique" ON "payments" USING btree ("paymentId","userId","productId");--> statement-breakpoint
ALTER TABLE "product_entitlements" ADD CONSTRAINT "product_entitlements_payment_owner_product_fk" FOREIGN KEY ("sourcePaymentId","userId","productId") REFERENCES "public"."payments"("paymentId","userId","productId") ON DELETE no action ON UPDATE no action;
