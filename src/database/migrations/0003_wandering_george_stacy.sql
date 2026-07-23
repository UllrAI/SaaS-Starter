LOCK TABLE "uploads" IN SHARE ROW EXCLUSIVE MODE;--> statement-breakpoint
DROP INDEX "uploads_fileKey_idx";--> statement-breakpoint
DELETE FROM "uploads"
WHERE "id" IN (
	SELECT "id"
	FROM (
		SELECT
			"id",
			row_number() OVER (
				PARTITION BY "fileKey"
				ORDER BY "createdAt" ASC, "id" ASC
			) AS "duplicateRank"
		FROM "uploads"
	) AS "rankedUploads"
	WHERE "duplicateRank" > 1
);--> statement-breakpoint
CREATE UNIQUE INDEX "uploads_fileKey_unique" ON "uploads" USING btree ("fileKey");
