// lib/admin/stats.ts
import type { AdminStats } from "@/app/dashboard/admin/_components/admin-stats-cards";
import { db } from "@/database";
import { users, subscriptions, payments, uploads } from "@/database/schema";
import { and, count, sum, desc, eq, inArray, gte, sql } from "drizzle-orm";
import { formatFileSize } from "@/lib/config/upload";

// Extended interface for chart data
interface ChartData {
  recentUsers: Array<{
    date: string;
    count: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    count: number;
  }>;
}

export interface AdminStatsWithCharts extends AdminStats {
  charts: ChartData;
}

interface UploadStatsDetails {
  total: number;
  totalSize: number;
  totalSizeFormatted: string;
  averageSize: number;
  averageSizeFormatted: string;
  topFileTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  recentUploads: number;
}

export async function getUserStats(): Promise<AdminStats["users"]> {
  const [userTotal, userVerified, userAdmins] = await Promise.all([
    db.select({ value: count() }).from(users),
    db
      .select({ value: count() })
      .from(users)
      .where(eq(users.emailVerified, true)),
    db
      .select({ value: count() })
      .from(users)
      .where(inArray(users.role, ["admin", "super_admin"])),
  ]);

  return {
    total: userTotal[0]?.value || 0,
    verified: userVerified[0]?.value || 0,
    admins: userAdmins[0]?.value || 0,
  };
}

export async function getSubscriptionStats(): Promise<
  AdminStats["subscriptions"]
> {
  const [subTotal, subActive, subCanceled] = await Promise.all([
    db.select({ value: count() }).from(subscriptions),
    db
      .select({ value: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active")),
    db
      .select({ value: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, "canceled")),
  ]);

  return {
    total: subTotal[0]?.value || 0,
    active: subActive[0]?.value || 0,
    canceled: subCanceled[0]?.value || 0,
  };
}

export async function getPaymentStats(): Promise<AdminStats["payments"]> {
  const [payTotal, payTotalRevenue, paySuccessful] = await Promise.all([
    db.select({ value: count() }).from(payments),
    db
      .select({ value: sum(payments.amount) })
      .from(payments)
      .where(
        and(eq(payments.status, "succeeded"), eq(payments.currency, "usd")),
      ),
    db
      .select({ value: count() })
      .from(payments)
      .where(eq(payments.status, "succeeded")),
  ]);

  return {
    total: payTotal[0]?.value || 0,
    totalRevenue: Number(payTotalRevenue[0]?.value) || 0,
    successful: paySuccessful[0]?.value || 0,
  };
}

export async function getUploadStats(): Promise<AdminStats["uploads"]> {
  const [uploadTotal, uploadTotalSize] = await Promise.all([
    db.select({ value: count() }).from(uploads),
    db.select({ value: sum(uploads.fileSize) }).from(uploads),
  ]);

  return {
    total: uploadTotal[0]?.value || 0,
    totalSize: Number(uploadTotalSize[0]?.value) || 0,
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  const [userStats, subscriptionStats, paymentStats, uploadStats] =
    await Promise.all([
      getUserStats(),
      getSubscriptionStats(),
      getPaymentStats(),
      getUploadStats(),
    ]);

  return {
    users: userStats,
    subscriptions: subscriptionStats,
    payments: paymentStats,
    uploads: uploadStats,
  };
}

export async function getAdminStatsWithCharts(): Promise<AdminStatsWithCharts> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const userCreatedDate = sql<string>`to_char(${users.createdAt}, 'YYYY-MM-DD')`;
  const paymentCreatedMonth = sql<string>`to_char(${payments.createdAt}, 'YYYY-MM')`;

  const [basicStats, recentUsersData, monthlyRevenueRaw] = await Promise.all([
    getAdminStats(),
    db
      .select({
        date: userCreatedDate,
        count: count(),
      })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo))
      .groupBy(userCreatedDate)
      .orderBy(desc(userCreatedDate)),
    db
      .select({
        month: paymentCreatedMonth,
        revenue: sum(payments.amount),
        count: count(),
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, "succeeded"),
          eq(payments.currency, "usd"),
          gte(payments.createdAt, twelveMonthsAgo),
        ),
      )
      .groupBy(paymentCreatedMonth)
      .orderBy(desc(paymentCreatedMonth)),
  ]);

  const monthlyRevenueData = monthlyRevenueRaw.map((data) => ({
    month: data.month,
    revenue: Number(data.revenue) || 0,
    count: data.count,
  }));

  return {
    ...basicStats,
    charts: {
      recentUsers: recentUsersData,
      monthlyRevenue: monthlyRevenueData,
    },
  };
}

export async function getUploadStatsDetails(): Promise<UploadStatsDetails> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [basicStats, recentStats, fileTypeStats] = await Promise.all([
    db
      .select({
        total: count(),
        totalSize: sum(uploads.fileSize),
      })
      .from(uploads),
    db
      .select({
        recentUploads: count(),
      })
      .from(uploads)
      .where(gte(uploads.createdAt, twentyFourHoursAgo)),
    db
      .select({
        contentType: uploads.contentType,
        count: count(),
      })
      .from(uploads)
      .groupBy(uploads.contentType)
      .orderBy(desc(count()))
      .limit(10),
  ]);

  const { total, totalSize: rawTotalSize } = basicStats[0] || {
    total: 0,
    totalSize: "0",
  };
  const { recentUploads } = recentStats[0] || { recentUploads: 0 };
  const totalSize = Number(rawTotalSize) || 0;

  const typeCategories: { [key: string]: number } = {};
  fileTypeStats.forEach((stat) => {
    let category = "Other";
    if (stat.contentType.startsWith("image/")) category = "Image";
    else if (stat.contentType.startsWith("video/")) category = "Video";
    else if (stat.contentType.startsWith("audio/")) category = "Audio";
    else if (stat.contentType.includes("pdf")) category = "PDF";
    else if (stat.contentType.startsWith("text/")) category = "Text";
    else if (
      stat.contentType.includes("zip") ||
      stat.contentType.includes("rar")
    )
      category = "Archive";

    typeCategories[category] = (typeCategories[category] || 0) + stat.count;
  });

  const topFileTypes = Object.entries(typeCategories)
    .map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / (total || 1)) * 100),
    }))
    .toSorted((a, b) => b.count - a.count);

  const averageSize = total > 0 ? totalSize / total : 0;

  return {
    total: total || 0,
    totalSize,
    totalSizeFormatted: formatFileSize(totalSize),
    averageSize,
    averageSizeFormatted: formatFileSize(averageSize),
    topFileTypes,
    recentUploads: recentUploads || 0,
  };
}
