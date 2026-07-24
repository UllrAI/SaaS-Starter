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
import { getUsers } from "@/lib/actions/admin";
import { createMetadataDefaults } from "@/lib/metadata";
export async function generateMetadata() {
  const { t } = await getServerTranslations();
  const metadata = createMetadataDefaults();
  return {
    ...metadata,
    title: t("d4087fd47957", "User Management"),
    description: t(
      "c812c1d487d3",
      "Manage user accounts, roles, and permissions",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("8fc0957ba892", "User Management"),
      description: t(
        "d2c6a7c3e392",
        "Manage user accounts, roles, and permissions",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("7d06eadbc106", "User Management"),
      description: t(
        "4d667a4b0712",
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
      title={<>{t("ce91e184c28a", "User Management")}</>}
      parentTitle={<>{t("d778c006a4d7", "Admin Dashboard")}</>}
      parentUrl="/dashboard/admin"
    >
      <Suspense fallback={<StatsCardsSkeleton />}>
        <UserStatsCards />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>{t("428e2f16de95", "All Users")}</CardTitle>
          <CardDescription>
            {t("ab6f59c0be34", "Manage user accounts, roles, and permissions")}
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
