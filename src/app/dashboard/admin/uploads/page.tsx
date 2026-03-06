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
import { createLocalizedMetadata } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return createLocalizedMetadata({
    en: {
      title: "Upload Management",
      description: "Manage user uploads, file storage, and content moderation",
    },
    "zh-Hans": {
      title: "上传管理",
      description: "管理用户上传、文件存储与内容审核。",
    },
  });
}

export default async function UploadManagementPage() {
  await requireAdmin();
  const initialTableData = await getUploads({});

  return (
    <DashboardPageWrapper
      title="Upload Management"
      parentTitle="Admin Dashboard"
      parentUrl="/dashboard/admin"
    >
      <Suspense fallback={<StatsCardsSkeleton />}>
        <UploadStatsCards />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>All Uploads</CardTitle>
          <CardDescription>
            Manage user uploads, monitor storage usage, and moderate content
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
