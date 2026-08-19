ALTER TABLE "payments" ADD COLUMN "paymentIntentId" text;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_paymentIntentId_unique" ON "payments" USING btree ("paymentIntentId");
