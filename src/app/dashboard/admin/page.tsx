import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/permissions";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { createMetadata } from "@/lib/metadata";

import { AdminStatsCards } from "./_components/admin-stats-cards";
import {
  getAdminStatsWithCharts,
  AdminStatsWithCharts,
} from "@/lib/admin/stats";
import { RecentUsersChart } from "./_components/recent-users-chart";
import { RevenueChart } from "./_components/revenue-chart";

export const metadata = createMetadata({
  title: "Admin Dashboard",
  description:
    "Administrative dashboard for managing users, payments, and system overview",
});

export default async function AdminDashboardPage() {
  // Require admin authentication
  await requireAdmin();

  // Fetch all data in parallel on the server
  const statsWithCharts: AdminStatsWithCharts = await getAdminStatsWithCharts();

  return (
    <DashboardPageWrapper title="Admin Dashboard">
      {/* Stats Cards */}
      <AdminStatsCards initialStats={statsWithCharts} />

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
            <RecentUsersChart chartData={statsWithCharts.charts.recentUsers} />
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
          <RevenueChart chartData={statsWithCharts.charts.monthlyRevenue} />
        </CardContent>
      </Card>
    </DashboardPageWrapper>
  );
}
