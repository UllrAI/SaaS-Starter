DROP INDEX "api_keys_userId_idx";--> statement-breakpoint
DROP INDEX "cli_tokens_userId_idx";--> statement-breakpoint
DROP INDEX "payments_userId_idx";--> statement-breakpoint
DROP INDEX "subscriptions_userId_idx";--> statement-breakpoint
DROP INDEX "uploads_userId_idx";--> statement-breakpoint
CREATE INDEX "api_keys_userId_createdAt_idx" ON "api_keys" USING btree ("userId","createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "cli_tokens_userId_createdAt_idx" ON "cli_tokens" USING btree ("userId","createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "payments_userId_createdAt_idx" ON "payments" USING btree ("userId","createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sessions_userId_idx" ON "sessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "subscriptions_userId_createdAt_idx" ON "subscriptions" USING btree ("userId","createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "uploads_userId_createdAt_idx" ON "uploads" USING btree ("userId","createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
ALTER TABLE "cli_tokens" DROP COLUMN "previousRefreshTokenHash";--> statement-breakpoint
ALTER TABLE "cli_tokens" DROP COLUMN "refreshRotatedAt";