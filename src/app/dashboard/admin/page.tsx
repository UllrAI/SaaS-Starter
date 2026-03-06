import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/permissions";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { createPageMetadata } from "@/lib/i18n/page-metadata";
import { AdminStatsCards } from "./_components/admin-stats-cards";
import {
  getAdminStatsWithCharts,
  AdminStatsWithCharts,
} from "@/lib/admin/stats";
import { RecentUsersChart } from "./_components/recent-users-chart";
import { RevenueChart } from "./_components/revenue-chart";
import { getRequestLocale } from "@/lib/i18n/server-locale";

async function AdminDashboardMetadataTitle() {
  return <>Admin Dashboard</>;
}

async function AdminDashboardMetadataDescription() {
  return <>Administrative dashboard for managing users, payments, and system overview</>;
}

export async function generateMetadata() {
  return createPageMetadata({
    title: AdminDashboardMetadataTitle,
    description: AdminDashboardMetadataDescription,
  });
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [locale, statsWithCharts] = await Promise.all([
    getRequestLocale(),
    getAdminStatsWithCharts(),
  ]);
  const { charts, ...summaryStats } = statsWithCharts as AdminStatsWithCharts;

  return (
    <DashboardPageWrapper title="Admin Dashboard">
      <AdminStatsCards stats={summaryStats} locale={locale} />

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <Card>
          <CardHeader>
          <CardTitle>User Growth</CardTitle>
            <CardDescription>
              New user registrations over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RecentUsersChart chartData={charts.recentUsers} />
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Monthly revenue and payment trends</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <RevenueChart chartData={charts.monthlyRevenue} />
        </CardContent>
      </Card>
    </DashboardPageWrapper>
  );
}
