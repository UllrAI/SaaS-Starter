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
    title: t("admin_dashboard"),
    description: t("admin_dashboard_overview"),
    openGraph: {
      ...metadata.openGraph,
      title: t("admin_dashboard"),
      description: t("admin_dashboard_overview"),
    },
    twitter: {
      ...metadata.twitter,
      title: t("admin_dashboard"),
      description: t("admin_dashboard_overview"),
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
    <DashboardPageWrapper title={<>{t("admin_dashboard_page")}</>}>
      <AdminStatsCards stats={summaryStats} locale={locale} />
      <AdminDashboardCharts charts={charts} />
    </DashboardPageWrapper>
  );
}
