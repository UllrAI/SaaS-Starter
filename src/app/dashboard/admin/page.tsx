import { requireAdmin } from "@/lib/auth/permissions";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { createMetadata } from "@/lib/metadata";
import { AdminStatsCards } from "./_components/admin-stats-cards";
import { AdminDashboardCharts } from "./_components/admin-dashboard-charts";
import {
  getAdminStatsWithCharts,
  AdminStatsWithCharts,
} from "@/lib/admin/stats";
import { getRequestLocale } from "@/lib/i18n/server-locale";

export async function generateMetadata() {
  const metadata = createMetadata({});

  return {
    ...metadata,
    title: "Admin Dashboard",
    description:
      "Administrative dashboard for managing users, payments, and system overview",
    openGraph: {
      ...metadata.openGraph,
      title: "Admin Dashboard",
      description:
        "Administrative dashboard for managing users, payments, and system overview",
    },
    twitter: {
      ...metadata.twitter,
      title: "Admin Dashboard",
      description:
        "Administrative dashboard for managing users, payments, and system overview",
    },
  };
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [locale, statsWithCharts] = await Promise.all([
    getRequestLocale(),
    getAdminStatsWithCharts(),
  ]);
  const { charts, ...summaryStats } = statsWithCharts as AdminStatsWithCharts;

  return (
    <DashboardPageWrapper title={<>Admin Dashboard</>}>
      <AdminStatsCards stats={summaryStats} locale={locale} />
      <AdminDashboardCharts charts={charts} />
    </DashboardPageWrapper>
  );
}
