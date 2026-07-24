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
import { getUploads } from "@/lib/actions/admin";
import { createMetadataDefaults } from "@/lib/metadata";
export async function generateMetadata() {
  const { locale, t } = await getServerTranslations();
  const metadata = createMetadataDefaults({ locale });
  return {
    ...metadata,
    title: t("86afaf3ae958", "Upload Management"),
    description: t(
      "40e567e43147",
      "Manage user uploads, file storage, and content moderation",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("8b82d1125201", "Upload Management"),
      description: t(
        "95284ac7bc0d",
        "Manage user uploads, file storage, and content moderation",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("1d06614da7b2", "Upload Management"),
      description: t(
        "d6a0444d110a",
        "Manage user uploads, file storage, and content moderation",
      ),
    },
  };
}
export default async function UploadManagementPage() {
  const { t } = await getServerTranslations();
  await requireAdmin();
  const initialTableData = await getUploads({});
  return (
    <DashboardPageWrapper
      title={<>{t("4b7c277d7906", "Upload Management")}</>}
      parentTitle={<>{t("a300aa3b45a3", "Admin Dashboard")}</>}
      parentUrl="/dashboard/admin"
    >
      <Suspense fallback={<StatsCardsSkeleton />}>
        <UploadStatsCards />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>{t("4b58cdbd80a9", "All Uploads")}</CardTitle>
          <CardDescription>
            {t(
              "1c54edf95a81",
              "Manage user uploads, monitor storage usage, and moderate content",
            )}
          </CardDescription>
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
