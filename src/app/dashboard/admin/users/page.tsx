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
import { createLocalizedMetadata } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return createLocalizedMetadata({
    en: {
      title: "User Management",
      description: "Manage user accounts, roles, and permissions",
    },
    "zh-Hans": {
      title: "用户管理",
      description: "管理用户账户、角色与权限。",
    },
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
