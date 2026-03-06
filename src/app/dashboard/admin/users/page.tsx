import { requireAdmin } from "@/lib/auth/permissions";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardPageWrapper } from "../../_components/dashboard-page-wrapper";
import { UserManagementTable } from "./_components/user-management-table";
import { UserStatsCards } from "./_components/user-stats-cards";
import { StatsCardsSkeleton } from "../_components/stats-cards-skeleton";
import { getUsers } from "@/lib/actions/admin";
import { createPageMetadata } from "@/lib/i18n/page-metadata";

async function UserManagementMetadataTitle() {
  return <>User Management</>;
}

async function UserManagementMetadataDescription() {
  return <>Manage user accounts, roles, and permissions</>;
}

export async function generateMetadata() {
  return createPageMetadata({
    title: UserManagementMetadataTitle,
    description: UserManagementMetadataDescription,
  });
}

export default async function UserManagementPage() {
  await requireAdmin();

  const initialTableData = await getUsers({});

  return (
    <DashboardPageWrapper
      title="User Management"
      parentTitle="Admin Dashboard"
      parentUrl="/dashboard/admin"
    >
      <Suspense fallback={<StatsCardsSkeleton />}>
        <UserStatsCards />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagementTable
            initialData={initialTableData.data}
            initialPagination={initialTableData.pagination}
          />
        </CardContent>
      </Card>
    </DashboardPageWrapper>
  );
}
