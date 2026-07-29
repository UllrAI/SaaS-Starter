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
import { SITE_CONFIG } from "@/lib/config/site";
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
      {t("admin_loading_chart", "Loading chart...")}
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
            <CardTitle>{t("admin_user_growth", "User Growth")}</CardTitle>
            <CardDescription>
              {t(
                "admin_new_user_registrations_over_last_30",
                "New user registrations over the last 30 days",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RecentUsersChart chartData={charts.recentUsers} />
          </CardContent>
        </Card>
      </div>

      {SITE_CONFIG.features.billing && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t("admin_revenue_overview", "Revenue Overview")}
            </CardTitle>
            <CardDescription>
              {t(
                "admin_monthly_revenue_payment_trends",
                "Monthly revenue and payment trends",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart chartData={charts.monthlyRevenue} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
