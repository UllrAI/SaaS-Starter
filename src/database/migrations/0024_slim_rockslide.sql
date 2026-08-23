CREATE TABLE "ai_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"conversationId" uuid NOT NULL,
	"messageId" text NOT NULL,
	"agentId" text NOT NULL,
	"model" text NOT NULL,
	"reasoningEffort" text NOT NULL,
	"inputTokens" integer,
	"cacheReadTokens" integer,
	"cacheWriteTokens" integer,
	"outputTokens" integer,
	"reasoningTokens" integer,
	"totalTokens" integer,
	"finishReason" text,
	"aborted" boolean DEFAULT false NOT NULL,
	"durationMs" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_conversationId_ai_conversations_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_usage_events_userId_createdAt_idx" ON "ai_usage_events" USING btree ("userId","createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "ai_usage_events_conversationId_idx" ON "ai_usage_events" USING btree ("conversationId");