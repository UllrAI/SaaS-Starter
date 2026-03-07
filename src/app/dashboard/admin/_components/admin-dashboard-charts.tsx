"use client";

import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AdminStatsWithCharts } from "@/lib/admin/stats";

const RecentUsersChart = dynamic(
  () => import("./recent-users-chart").then((mod) => mod.RecentUsersChart),
  {
    ssr: false,
    loading: () => <ChartLoadingMessage heightClassName="h-[300px]" />,
  },
);

const RevenueChart = dynamic(
  () => import("./revenue-chart").then((mod) => mod.RevenueChart),
  {
    ssr: false,
    loading: () => <ChartLoadingMessage heightClassName="h-[400px]" />,
  },
);

function ChartLoadingMessage({
  heightClassName,
}: {
  heightClassName: string;
}) {
  return (
    <div
      className={`text-muted-foreground flex items-center justify-center text-sm ${heightClassName}`}
    >
      Loading chart...
    </div>
  );
}

interface AdminDashboardChartsProps {
  charts: AdminStatsWithCharts["charts"];
}

export function AdminDashboardCharts({ charts }: AdminDashboardChartsProps) {
  return (
    <>
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

      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Monthly revenue and payment trends</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <RevenueChart chartData={charts.monthlyRevenue} />
        </CardContent>
      </Card>
    </>
  );
}
