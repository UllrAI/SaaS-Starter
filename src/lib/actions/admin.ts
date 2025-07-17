"use server";

import { db } from "@/database";
import {
  users,
  subscriptions,
  payments,
  uploads,
  userRoleEnum,
} from "@/database/schema";
import {
  eq,
  desc,
  asc,
  count,
  and,
  or,
  gte,
  lte,
  ilike,
  like,
  not,
  SQLWrapper,
  inArray,
} from "drizzle-orm";
import type {
  UserWithSubscription,
  PaymentWithUser,
  SubscriptionWithUser,
  SubscriptionStatus,
} from "@/types/billing";
import {
  getProductTierById,
  getProductTierByProductId,
} from "@/lib/config/products";
import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { requireAdmin } from "../auth/permissions";
import { revalidatePath } from "next/cache";
import { creemClient } from "../billing/creem/client";
import env from "@/env";
import {
  deleteFiles as deleteFilesFromR2,
  deleteFile as deleteFileFromR2,
} from "../r2";
import type { UserRole } from "../config/roles";

// --- 安全的 Action Client ---
const actionClient = createSafeActionClient();

const adminAction = actionClient.use(async ({ next }) => {
  const user = await requireAdmin();
  return next({ ctx: { user } });
});

// --- 数据查询函数 ---
// (此部分代码保持不变，为简洁起见省略)
interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole | "all";
  sortBy?: "createdAt" | "name" | "email";
  sortOrder?: "asc" | "desc";
}

export async function getUsers({
  page = 1,
  limit = 20,
  search = "",
  role = "all",
  sortBy = "createdAt",
  sortOrder = "desc",
}: GetUsersParams) {
  const offset = (page - 1) * limit;

  const whereConditions = [];
  if (search) {
    whereConditions.push(
      or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)),
    );
  }
  if (role !== "all") {
    whereConditions.push(eq(users.role, role));
  }
  const whereClause =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const orderByClause =
    sortOrder === "asc" ? asc(users[sortBy]) : desc(users[sortBy]);

  const usersQuery = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      image: users.image,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      subscriptionStatus: subscriptions.status,
      subscriptionId: subscriptions.subscriptionId,
    })
    .from(users)
    .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  const totalQuery = db
    .select({ total: count() })
    .from(users)
    .where(whereClause);

  const [rawUsers, [{ total }]] = await Promise.all([usersQuery, totalQuery]);

  const usersMap = new Map<string, UserWithSubscription>();
  rawUsers.forEach((user) => {
    const existingUser = usersMap.get(user.id);
    if (!existingUser) {
      const userSubscriptions = [];
      if (user.subscriptionId && user.subscriptionStatus) {
        userSubscriptions.push({
          subscriptionId: user.subscriptionId,
          status: user.subscriptionStatus,
        });
      }
      usersMap.set(user.id, {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        subscriptions: userSubscriptions,
      });
    } else if (user.subscriptionId && user.subscriptionStatus) {
      const subscriptionExists = existingUser.subscriptions.some(
        (sub) => sub.subscriptionId === user.subscriptionId,
      );
      if (!subscriptionExists) {
        existingUser.subscriptions.push({
          subscriptionId: user.subscriptionId,
          status: user.subscriptionStatus,
        });
      }
    }
  });

  const usersList = Array.from(usersMap.values());

  return {
    data: usersList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

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
  const offset = (page - 1) * limit;
  const whereConditions = [];

  if (search) {
    whereConditions.push(
      or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(payments.paymentId, `%${search}%`),
      ),
    );
  }
  if (status !== "all") whereConditions.push(eq(payments.status, status));
  if (dateFrom)
    whereConditions.push(gte(payments.createdAt, new Date(dateFrom)));
  if (dateTo) whereConditions.push(lte(payments.createdAt, new Date(dateTo)));

  const whereClause =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;
  const orderByClause =
    sortOrder === "asc" ? asc(payments[sortBy]) : desc(payments[sortBy]);

  const paymentsQuery = db
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
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  const totalQuery = db
    .select({ total: count() })
    .from(payments)
    .leftJoin(users, eq(payments.userId, users.id))
    .where(whereClause);
  const [rawPayments, [{ total }]] = await Promise.all([
    paymentsQuery,
    totalQuery,
  ]);

  const paymentsList: PaymentWithUser[] = rawPayments
    .filter((p) => p.user)
    .map((payment) => ({
      ...payment,
      user: payment.user!,
      tierName:
        getProductTierByProductId(payment.productId)?.name ||
        getProductTierById(payment.productId)?.name ||
        "Unknown Product",
    }));

  return {
    data: paymentsList,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

interface GetSubscriptionsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SubscriptionStatus | "all";
  sortBy?: "createdAt" | "currentPeriodEnd" | "status";
  sortOrder?: "asc" | "desc";
}

export async function getSubscriptions({
  page = 1,
  limit = 20,
  search = "",
  status = "all",
  sortBy = "createdAt",
  sortOrder = "desc",
}: GetSubscriptionsParams) {
  const offset = (page - 1) * limit;
  const whereConditions = [];

  if (search) {
    whereConditions.push(
      or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(subscriptions.subscriptionId, `%${search}%`),
      ),
    );
  }
  if (status !== "all") whereConditions.push(eq(subscriptions.status, status));

  const whereClause =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;
  const orderByClause =
    sortOrder === "asc"
      ? asc(subscriptions[sortBy])
      : desc(subscriptions[sortBy]);

  const subscriptionsQuery = db
    .select({
      id: subscriptions.id,
      subscriptionId: subscriptions.subscriptionId,
      productId: subscriptions.productId,
      status: subscriptions.status,
      currentPeriodStart: subscriptions.currentPeriodStart,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      canceledAt: subscriptions.canceledAt,
      createdAt: subscriptions.createdAt,
      updatedAt: subscriptions.updatedAt,
      userId: subscriptions.userId,
      customerId: subscriptions.customerId,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      },
    })
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.userId, users.id))
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  const totalQuery = db
    .select({ total: count() })
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.userId, users.id))
    .where(whereClause);
  const [rawSubscriptions, [{ total }]] = await Promise.all([
    subscriptionsQuery,
    totalQuery,
  ]);

  const subscriptionsList: SubscriptionWithUser[] = rawSubscriptions
    .filter(
      (sub): sub is typeof sub & { user: NonNullable<typeof sub.user> } =>
        sub.user !== null,
    )
    .map((sub) => {
      const productTier =
        getProductTierById(sub.productId) ||
        getProductTierByProductId(sub.productId);
      return {
        ...sub,
        tierId: sub.productId,
        status: sub.status as SubscriptionStatus,
        planName: productTier?.name || "Unknown Plan",
      };
    });

  return {
    data: subscriptionsList,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
interface GetUploadsParams {
  page?: number;
  limit?: number;
  search?: string;
  fileType?: string;
}

export async function getUploads({
  page = 1,
  limit = 20,
  search = "",
  fileType = "all",
}: GetUploadsParams) {
  const offset = (page - 1) * limit;
  const conditions: (SQLWrapper | undefined)[] = [];

  if (search) {
    conditions.push(
      or(
        ilike(uploads.fileName, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(users.name, `%${search}%`),
      ),
    );
  }

  if (fileType !== "all") {
    const typeConditions: Record<string, SQLWrapper> = {
      image: like(uploads.contentType, "image/%"),
      video: like(uploads.contentType, "video/%"),
      audio: like(uploads.contentType, "audio/%"),
      pdf: eq(uploads.contentType, "application/pdf"),
      text: like(uploads.contentType, "text/%"),
      archive: or(
        like(uploads.contentType, "%zip%"),
        like(uploads.contentType, "%rar%"),
        like(uploads.contentType, "%tar%"),
        like(uploads.contentType, "%7z%"),
      )!,
    };

    if (fileType in typeConditions) {
      conditions.push(typeConditions[fileType]);
    } else if (fileType === "other") {
      conditions.push(
        and(...Object.values(typeConditions).map((cond) => not(cond))),
      );
    }
  }

  const whereCondition =
    conditions.length > 0
      ? and(...(conditions.filter(Boolean) as SQLWrapper[]))
      : undefined;

  const uploadsDataQuery = db
    .select({
      id: uploads.id,
      userId: uploads.userId,
      fileKey: uploads.fileKey,
      url: uploads.url,
      fileName: uploads.fileName,
      fileSize: uploads.fileSize,
      contentType: uploads.contentType,
      createdAt: uploads.createdAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      },
    })
    .from(uploads)
    .innerJoin(users, eq(uploads.userId, users.id))
    .where(whereCondition)
    .orderBy(desc(uploads.createdAt))
    .limit(limit)
    .offset(offset);

  const totalQuery = db
    .select({ total: count() })
    .from(uploads)
    .innerJoin(users, eq(uploads.userId, users.id))
    .where(whereCondition);

  const [uploadsData, [{ total: totalCount }]] = await Promise.all([
    uploadsDataQuery,
    totalQuery,
  ]);

  return {
    data: uploadsData,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

// --- Server Actions ---

const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  role: z.enum(userRoleEnum.enumValues).optional(),
});

export const updateUserAction = adminAction
  .schema(updateUserSchema)
  .action(async ({ parsedInput: input, ctx }) => {
    const [targetUser] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, input.id))
      .limit(1);

    if (!targetUser) {
      throw new Error("User not found");
    }

    if (
      (targetUser.role === "super_admin" || input.role === "super_admin") &&
      ctx.user.role !== "super_admin"
    ) {
      throw new Error("Insufficient permissions to modify super_admin");
    }

    if (
      input.id === ctx.user.id &&
      input.role &&
      input.role !== ctx.user.role
    ) {
      throw new Error("Cannot modify your own role");
    }

    await db.update(users).set(input).where(eq(users.id, input.id));
    revalidatePath("/dashboard/admin/users");
    return { success: true, message: "User updated successfully." };
  });

const cancelSubscriptionSchema = z.object({
  subscriptionId: z.string(),
});

export const cancelSubscriptionAction = adminAction
  .schema(cancelSubscriptionSchema)
  .action(async ({ parsedInput: { subscriptionId } }) => {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.subscriptionId, subscriptionId))
      .limit(1);

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    await creemClient.cancelSubscription({
      xApiKey: env.CREEM_API_KEY,
      id: subscription.subscriptionId,
    });

    revalidatePath("/dashboard/admin/subscriptions");
    return { success: true, message: "Subscription cancellation initiated." };
  });

const deleteUploadSchema = z.object({
  uploadId: z.string(),
});

export const deleteUploadAction = adminAction
  .schema(deleteUploadSchema)
  .action(async ({ parsedInput: { uploadId } }) => {
    const [upload] = await db
      .select({ fileKey: uploads.fileKey })
      .from(uploads)
      .where(eq(uploads.id, uploadId))
      .limit(1);

    if (!upload) {
      throw new Error("Upload not found");
    }

    await deleteFileFromR2(upload.fileKey);
    await db.delete(uploads).where(eq(uploads.id, uploadId));

    revalidatePath("/dashboard/admin/uploads");
    return { success: true, message: "Upload deleted successfully." };
  });

const batchDeleteUploadsSchema = z.object({
  uploadIds: z.array(z.string()).min(1),
});

export const batchDeleteUploadsAction = adminAction
  .schema(batchDeleteUploadsSchema)
  .action(async ({ parsedInput: { uploadIds } }) => {
    const records = await db
      .select({ id: uploads.id, fileKey: uploads.fileKey })
      .from(uploads)
      .where(inArray(uploads.id, uploadIds));

    if (records.length === 0) {
      throw new Error("No uploads found to delete.");
    }

    const fileKeysToDelete = records.map((r) => r.fileKey);
    const deleteResult = await deleteFilesFromR2(fileKeysToDelete);

    if (!deleteResult.success) {
      // 如果批量删除失败，可以抛出错误或返回部分成功的消息
      throw new Error(deleteResult.error || "Failed to delete files from R2.");
    }

    // 只有在 R2 删除成功后，才从数据库中删除记录
    await db.delete(uploads).where(inArray(uploads.id, uploadIds));

    revalidatePath("/dashboard/admin/uploads");
    return {
      success: true,
      message: `Successfully deleted ${records.length} file(s).`,
    };
  });
