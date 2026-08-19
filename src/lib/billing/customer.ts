import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/database";
import { users } from "@/database/tables";

import { billing } from ".";

/**
 * Resolve the billing customer for a user, creating one on first checkout.
 *
 * The row lock serializes concurrent checkouts for the same user. Without it
 * two parallel requests would each create a provider customer, and webhooks
 * for the customer that lost the race would never match the stored ID.
 */
export async function ensureBillingCustomerId(user: {
  id: string;
  email: string;
  name?: string | null;
}): Promise<string> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ customerId: users.paymentProviderCustomerId })
      .from(users)
      .where(eq(users.id, user.id))
      .for("update");

    if (!row) {
      throw new Error(`User ${user.id} was not found.`);
    }
    if (row.customerId) {
      return row.customerId;
    }

    const { customerId } = await billing.createCustomer({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    await tx
      .update(users)
      .set({ paymentProviderCustomerId: customerId })
      .where(eq(users.id, user.id));

    return customerId;
  });
}
