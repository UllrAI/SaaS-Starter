import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/database";
import { users } from "@/database/tables";

import { billing } from ".";

/** Resolve the billing customer for a user, creating one on first checkout. */
export async function ensureBillingCustomerId(user: {
  id: string;
  email: string;
  name?: string | null;
}): Promise<string> {
  const [row] = await db
    .select({ customerId: users.paymentProviderCustomerId })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  if (!row) throw new Error(`User ${user.id} was not found.`);
  if (row.customerId) return row.customerId;

  // Stripe's per-user idempotency key makes concurrent calls return the same
  // customer. Keep the network request outside a database transaction.
  const { customerId } = await billing.createCustomer({
    userId: user.id,
    email: user.email,
    name: user.name,
  });
  const claimed = await db
    .update(users)
    .set({ paymentProviderCustomerId: customerId })
    .where(and(eq(users.id, user.id), isNull(users.paymentProviderCustomerId)))
    .returning({ customerId: users.paymentProviderCustomerId });
  if (claimed[0]?.customerId) return claimed[0].customerId;

  const [current] = await db
    .select({ customerId: users.paymentProviderCustomerId })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  if (!current) throw new Error(`User ${user.id} was not found.`);
  if (!current.customerId) {
    throw new Error(`Billing customer for user ${user.id} was not stored.`);
  }
  if (current.customerId !== customerId) {
    throw new Error(`Billing customer for user ${user.id} is inconsistent.`);
  }
  return current.customerId;
}
