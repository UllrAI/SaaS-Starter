"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
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
function ChartLoadingMessage({ heightClassName }: { heightClassName: string }) {
  const { t } = useTranslation();
  return (
    <div
      className={`text-muted-foreground flex items-center justify-center text-sm ${heightClassName}`}
    >
      {t("4149a1d1fa8d", "Loading chart...")}
    </div>
  );
}
interface AdminDashboardChartsProps {
  charts: AdminStatsWithCharts["charts"];
}
export function AdminDashboardCharts({ charts }: AdminDashboardChartsProps) {
  const { t } = useTranslation();
  return (
    <>
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>{t("07e741ce10f1", "User Growth")}</CardTitle>
            <CardDescription>
              {t(
                "58cbbb10f274",
                "New user registrations over the last 30 days",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RecentUsersChart chartData={charts.recentUsers} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("8d31b3a9d0ea", "Revenue Overview")}</CardTitle>
          <CardDescription>
            {t("d43e9ea97a29", "Monthly revenue and payment trends")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <RevenueChart chartData={charts.monthlyRevenue} />
        </CardContent>
      </Card>
    </>
  );
}
