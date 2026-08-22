CREATE TYPE "public"."ai_message_role" AS ENUM('system', 'user', 'assistant');--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"title" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" text NOT NULL,
	"conversationId" uuid NOT NULL,
	"role" "ai_message_role" NOT NULL,
	"parts" jsonb NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_messages_conversationId_id_pk" PRIMARY KEY("conversationId","id")
);
--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversationId_ai_conversations_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_conversations_userId_updatedAt_idx" ON "ai_conversations" USING btree ("userId","updatedAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "ai_messages_conversationId_createdAt_idx" ON "ai_messages" USING btree ("conversationId","createdAt");