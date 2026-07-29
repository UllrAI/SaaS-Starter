import { getServerTranslations } from "@/lib/i18n/translation/server";
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
import { getUsers } from "@/lib/actions/admin/users";
import { createMetadataDefaults } from "@/lib/metadata";
export async function generateMetadata() {
  const { locale, t } = await getServerTranslations();
  const metadata = createMetadataDefaults({ locale });
  return {
    ...metadata,
    title: t("admin_user_management", "User Management"),
    description: t(
      "admin_manage_user_accounts_roles_permissions",
      "Manage user accounts, roles, and permissions",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("admin_user_management", "User Management"),
      description: t(
        "admin_manage_user_accounts_roles_permissions",
        "Manage user accounts, roles, and permissions",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("admin_user_management", "User Management"),
      description: t(
        "admin_manage_user_accounts_roles_permissions",
        "Manage user accounts, roles, and permissions",
      ),
    },
  };
}
export default async function UserManagementPage() {
  const { t } = await getServerTranslations();
  await requireAdmin();
  const initialTableData = await getUsers({});
  return (
    <DashboardPageWrapper
      title={<>{t("admin_user_management", "User Management")}</>}
      parentTitle={<>{t("admin_dashboard_page", "Admin Dashboard")}</>}
      parentUrl="/dashboard/admin"
    >
      <Suspense fallback={<StatsCardsSkeleton />}>
        <UserStatsCards />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin_all_users", "All Users")}</CardTitle>
          <CardDescription>
            {t(
              "admin_manage_user_accounts_roles_permissions_management",
              "Manage user accounts, roles, and permissions",
            )}
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
