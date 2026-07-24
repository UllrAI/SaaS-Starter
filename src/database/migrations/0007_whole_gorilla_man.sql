CREATE TABLE "product_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"productId" text NOT NULL,
	"sourcePaymentId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_entitlements" ADD CONSTRAINT "product_entitlements_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_entitlements" ADD CONSTRAINT "product_entitlements_sourcePaymentId_payments_paymentId_fk" FOREIGN KEY ("sourcePaymentId") REFERENCES "public"."payments"("paymentId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_entitlements_userId_productId_unique" ON "product_entitlements" USING btree ("userId","productId");--> statement-breakpoint
CREATE UNIQUE INDEX "product_entitlements_sourcePaymentId_unique" ON "product_entitlements" USING btree ("sourcePaymentId");--> statement-breakpoint
CREATE INDEX "product_entitlements_userId_createdAt_idx" ON "product_entitlements" USING btree ("userId","createdAt" DESC NULLS LAST);