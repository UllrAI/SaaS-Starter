import { getServerTranslations } from "@/lib/i18n/translation/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { createMetadataDefaults } from "@/lib/metadata";
import { AdminStatsCards } from "./_components/admin-stats-cards";
import { AdminDashboardCharts } from "./_components/admin-dashboard-charts";
import {
  getAdminStatsWithCharts,
  AdminStatsWithCharts,
} from "@/lib/admin/stats";
import { getRequestLocale } from "@/lib/i18n/server-locale";
export async function generateMetadata() {
  const { locale, t } = await getServerTranslations();
  const metadata = createMetadataDefaults({ locale });
  return {
    ...metadata,
    title: t("37d73939b141", "Admin Dashboard"),
    description: t(
      "12651cacfe25",
      "Administrative dashboard for managing users, payments, and system overview",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("3048738f6fa1", "Admin Dashboard"),
      description: t(
        "0585a9e57284",
        "Administrative dashboard for managing users, payments, and system overview",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("279d4eb24790", "Admin Dashboard"),
      description: t(
        "0cc09ff244d3",
        "Administrative dashboard for managing users, payments, and system overview",
      ),
    },
  };
}
export default async function AdminDashboardPage() {
  const { t } = await getServerTranslations();
  await requireAdmin();
  const [locale, statsWithCharts] = await Promise.all([
    getRequestLocale(),
    getAdminStatsWithCharts(),
  ]);
  const { charts, ...summaryStats } = statsWithCharts as AdminStatsWithCharts;
  return (
    <DashboardPageWrapper title={<>{t("c9620383eb1a", "Admin Dashboard")}</>}>
      <AdminStatsCards stats={summaryStats} locale={locale} />
      <AdminDashboardCharts charts={charts} />
    </DashboardPageWrapper>
  );
}
