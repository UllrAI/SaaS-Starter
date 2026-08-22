WITH "latest_user_messages" AS (
	SELECT "conversationId", max("createdAt") AS "createdAt"
	FROM "ai_messages"
	WHERE "role" = 'user'
	GROUP BY "conversationId"
)
UPDATE "ai_messages" AS "assistant_message"
SET "createdAt" = greatest(
	"assistant_message"."createdAt",
	"latest_user_messages"."createdAt" + interval '1 microsecond'
)
FROM "latest_user_messages"
WHERE "assistant_message"."conversationId" = "latest_user_messages"."conversationId"
	AND "assistant_message"."role" = 'assistant'
	AND "assistant_message"."id" = '';--> statement-breakpoint
UPDATE "ai_messages"
SET "id" = concat(
	'legacy-',
	"role"::text,
	'-',
	"conversationId"::text
)
WHERE "id" = '';--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_id_not_empty" CHECK (length("ai_messages"."id") > 0);
