import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readMigration(name: string): string {
  return readFileSync(
    resolve(process.cwd(), "src/database/migrations", name),
    "utf8",
  );
}

describe("billing provider migrations", () => {
  it("keeps the original migration immutable", () => {
    expect(readMigration("0000_true_mad_thinker.sql")).toContain(
      "\"provider\" text DEFAULT 'creem' NOT NULL",
    );
  });

  it("resets only billing state and applies the Stripe default forward", () => {
    const migration = readMigration("0019_reset_creem_billing.sql");
    const entitlementDelete = migration.indexOf(
      'DELETE FROM "product_entitlements"',
    );
    const paymentDelete = migration.indexOf('DELETE FROM "payments"');

    expect(entitlementDelete).toBeGreaterThanOrEqual(0);
    expect(paymentDelete).toBeGreaterThan(entitlementDelete);
    expect(migration).toContain('DELETE FROM "subscriptions"');
    expect(migration).toContain('DELETE FROM "webhook_events"');
    expect(migration).toContain('SET "paymentProviderCustomerId" = NULL');
    expect(migration).toContain(
      "ALTER COLUMN \"provider\" SET DEFAULT 'stripe'",
    );
    expect(migration).not.toContain('DELETE FROM "users"');
  });
});

describe("AI chat history migration", () => {
  it("stores user-owned conversations and ordered message payloads", () => {
    const migration = readMigration("0020_powerful_killraven.sql");

    expect(migration).toContain('CREATE TABLE "ai_conversations"');
    expect(migration).toContain('CREATE TABLE "ai_messages"');
    expect(migration).toContain('"parts" jsonb NOT NULL');
    expect(migration).toContain(
      'FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade',
    );
    expect(migration).toContain(
      'FOREIGN KEY ("conversationId") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade',
    );
  });

  it("adds reversible conversation archiving", () => {
    const migration = readMigration("0021_equal_ser_duncan.sql");

    expect(migration).toContain(
      'ADD COLUMN "archivedAt" timestamp with time zone',
    );
    expect(migration).toContain(
      'CREATE INDEX "ai_conversations_userId_archivedAt_updatedAt_idx"',
    );
  });
});
