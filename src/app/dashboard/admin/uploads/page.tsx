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
import { createMetadata } from "@/lib/metadata";
import { UploadManagementTable } from "./_components/upload-management-table";
import { UploadStatsCards } from "./_components/upload-stats-cards";
import { StatsCardsSkeleton } from "../_components/stats-cards-skeleton";
import { getUploads } from "@/lib/actions/admin";

export const metadata = createMetadata({
  title: "Upload Management",
  description: "Manage user uploads, file storage, and content moderation",
});

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
