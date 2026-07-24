ALTER TABLE "rate_limit_buckets" ALTER COLUMN "resetAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "rate_limit_buckets" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "rate_limit_buckets" ALTER COLUMN "updatedAt" SET DEFAULT now();