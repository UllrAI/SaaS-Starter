// lib/admin/stats.ts
import { AdminStats } from "@/app/dashboard/admin/_components/admin-stats-cards";
import { db } from "@/database";
import { users, subscriptions, payments, uploads } from "@/database/schema";
import { count, sum, desc, eq, inArray, gte } from "drizzle-orm";
import { formatFileSize } from "@/lib/config/upload";

// Extended interface for chart data
export interface ChartData {
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

export interface UploadStatsDetails {
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

// Function to fetch only user-related stats
export async function getUserStats(): Promise<AdminStats["users"]> {
  try {
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
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return { total: 0, verified: 0, admins: 0 };
  }
}

// Function to fetch only subscription-related stats
export async function getSubscriptionStats(): Promise<
  AdminStats["subscriptions"]
> {
  try {
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
  } catch (error) {
    console.error("Error fetching subscription stats:", error);
    return { total: 0, active: 0, canceled: 0 };
  }
}

// Function to fetch only payment-related stats
export async function getPaymentStats(): Promise<AdminStats["payments"]> {
  try {
    const [payTotal, payTotalRevenue, paySuccessful] = await Promise.all([
      db.select({ value: count() }).from(payments),
      db.select({ value: sum(payments.amount) }).from(payments),
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
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    return { total: 0, totalRevenue: 0, successful: 0 };
  }
}

// Function to fetch only basic upload stats
export async function getUploadStats(): Promise<AdminStats["uploads"]> {
  try {
    const [uploadTotal, uploadTotalSize] = await Promise.all([
      db.select({ value: count() }).from(uploads),
      db.select({ value: sum(uploads.fileSize) }).from(uploads),
    ]);
    return {
      total: uploadTotal[0]?.value || 0,
      totalSize: Number(uploadTotalSize[0]?.value) || 0,
    };
  } catch (error) {
    console.error("Error fetching upload stats:", error);
    return { total: 0, totalSize: 0 };
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  try {
    // Fetch all stats in parallel using the new specific functions
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
  } catch (error) {
    console.error("Error fetching admin stats in lib/admin/stats.ts:", error);
    // Return a default structure on error
    return {
      users: { total: 0, verified: 0, admins: 0 },
      subscriptions: { total: 0, active: 0, canceled: 0 },
      payments: { total: 0, totalRevenue: 0, successful: 0 },
      uploads: { total: 0, totalSize: 0 },
    };
  }
}

// New function to get all admin data including charts
export async function getAdminStatsWithCharts(): Promise<AdminStatsWithCharts> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const [basicStats, recentUsersRaw, monthlyRevenueRaw] = await Promise.all([
      getAdminStats(),
      db
        .select({ createdAt: users.createdAt })
        .from(users)
        .where(gte(users.createdAt, thirtyDaysAgo))
        .orderBy(desc(users.createdAt)),
      db
        .select({ createdAt: payments.createdAt, amount: payments.amount })
        .from(payments)
        .where(gte(payments.createdAt, twelveMonthsAgo))
        .orderBy(desc(payments.createdAt)),
    ]);

    const userCountsByDate = recentUsersRaw.reduce(
      (acc, user) => {
        const date = user.createdAt.toISOString().split("T")[0]; // 'YYYY-MM-DD'
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const recentUsersData = Object.entries(userCountsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const revenueByMonth = monthlyRevenueRaw.reduce(
      (acc, payment) => {
        const month = payment.createdAt.toISOString().substring(0, 7); // 'YYYY-MM'
        if (!acc[month]) {
          acc[month] = { revenue: 0, count: 0 };
        }
        acc[month].revenue += Number(payment.amount);
        acc[month].count += 1;
        return acc;
      },
      {} as Record<string, { revenue: number; count: number }>,
    );

    const monthlyRevenueData = Object.entries(revenueByMonth)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        count: data.count,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    return {
      ...basicStats,
      charts: {
        recentUsers: recentUsersData,
        monthlyRevenue: monthlyRevenueData,
      },
    };
  } catch (error) {
    console.error("Error fetching admin stats with charts:", error);
    // Return default data structure
    const defaultStats = await getAdminStats();
    return {
      ...defaultStats,
      charts: {
        recentUsers: [],
        monthlyRevenue: [],
      },
    };
  }
}

export async function getUploadStatsDetails(): Promise<UploadStatsDetails> {
  try {
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
      .sort((a, b) => b.count - a.count);

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
  } catch (error) {
    console.error("Error fetching upload stats details:", error);
    return {
      total: 0,
      totalSize: 0,
      totalSizeFormatted: "0 B",
      averageSize: 0,
      averageSizeFormatted: "0 B",
      topFileTypes: [],
      recentUploads: 0,
    };
  }
}
