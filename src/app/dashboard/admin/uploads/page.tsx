import { getServerTranslations } from "@/lib/i18n/translation/server";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/permissions";
import { DashboardPageWrapper } from "../../_components/dashboard-page-wrapper";
import { UploadManagementTable } from "./_components/upload-management-table";
import { UploadStatsCards } from "./_components/upload-stats-cards";
import { StatsCardsSkeleton } from "../_components/stats-cards-skeleton";
import { getUploads } from "@/lib/actions/admin/uploads";
import { createMetadataDefaults } from "@/lib/metadata";
import { SITE_CONFIG } from "@/lib/config/site";
import { notFound } from "next/navigation";
export async function generateMetadata() {
  const { locale, t } = await getServerTranslations();
  const metadata = createMetadataDefaults({ locale });
  return {
    ...metadata,
    title: t("admin_upload_management"),
    description: t("admin_manage_uploads_storage"),
    openGraph: {
      ...metadata.openGraph,
      title: t("admin_upload_management"),
      description: t("admin_manage_uploads_storage"),
    },
    twitter: {
      ...metadata.twitter,
      title: t("admin_upload_management"),
      description: t("admin_manage_uploads_storage"),
    },
  };
}
export default async function UploadManagementPage() {
  if (!SITE_CONFIG.features.uploads) {
    notFound();
  }

  const { t } = await getServerTranslations();
  await requireAdmin();
  const initialTableData = await getUploads({});
  return (
    <DashboardPageWrapper
      title={<>{t("admin_upload_management")}</>}
      parentTitle={<>{t("admin_dashboard")}</>}
      parentUrl="/dashboard/admin"
    >
      <Suspense fallback={<StatsCardsSkeleton />}>
        <UploadStatsCards />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin_all_uploads")}</CardTitle>
          <CardDescription>{t("admin_monitor_storage_usage")}</CardDescription>
        </CardHeader>
        <CardContent>
          <UploadManagementTable
            initialData={initialTableData.data}
            initialPagination={initialTableData.pagination}
          />
        </CardContent>
      </Card>
    </DashboardPageWrapper>
  );
}
