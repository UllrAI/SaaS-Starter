"use server";

import { and, asc, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";

import { db } from "@/database";
import { payments, users } from "@/database/schema";
import { SITE_CONFIG } from "@/lib/config/site";
import { getProductTierById } from "@/lib/config/products";
import { IntegrationDisabledError } from "@/lib/config/integrations";
import { requireAdmin } from "@/lib/auth/permissions";
import type { PaymentWithUser } from "@/types/billing";

interface GetPaymentsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "succeeded" | "failed" | "pending" | "canceled" | "all";
  sortBy?: "createdAt" | "amount" | "status";
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
}

export async function getPayments({
  page = 1,
  limit = 20,
  search = "",
  status = "all",
  sortBy = "createdAt",
  sortOrder = "desc",
  dateFrom,
  dateTo,
}: GetPaymentsParams) {
  if (!SITE_CONFIG.features.billing) {
    throw new IntegrationDisabledError("billing");
  }
  await requireAdmin();

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(payments.paymentId, `%${search}%`),
      ),
    );
  }
  if (status !== "all") conditions.push(eq(payments.status, status));
  if (dateFrom) conditions.push(gte(payments.createdAt, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(payments.createdAt, new Date(dateTo)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const orderBy =
    sortOrder === "asc" ? asc(payments[sortBy]) : desc(payments[sortBy]);
  const offset = (page - 1) * limit;
  const [rawPayments, [{ total }]] = await Promise.all([
    db
      .select({
        id: payments.id,
        userId: payments.userId,
        paymentId: payments.paymentId,
        amount: payments.amount,
        currency: payments.currency,
        status: payments.status,
        paymentType: payments.paymentType,
        productId: payments.productId,
        subscriptionId: payments.subscriptionId,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        },
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .where(where),
  ]);

  const data: PaymentWithUser[] = rawPayments
    .filter((payment) => payment.user)
    .map((payment) => ({
      ...payment,
      user: payment.user!,
      tierName:
        getProductTierById(payment.productId)?.name || "Unknown Product",
    }));

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
