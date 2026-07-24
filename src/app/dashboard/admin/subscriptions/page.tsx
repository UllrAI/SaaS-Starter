import { getServerTranslations } from "@/lib/i18n/translation/server";
import { requireAdmin } from "@/lib/auth/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardPageWrapper } from "../../_components/dashboard-page-wrapper";
import { Suspense } from "react";
import { SubscriptionStatsCards } from "./_components/subscription-stats-cards";
import { SubscriptionManagementTable } from "./_components/subscription-management-table";
import { StatsCardsSkeleton } from "../_components/stats-cards-skeleton";
import { getSubscriptions } from "@/lib/actions/admin";
import { createMetadataDefaults } from "@/lib/metadata";
export async function generateMetadata() {
  const { t } = await getServerTranslations();
  const metadata = createMetadataDefaults();
  return {
    ...metadata,
    title: t("c844cc919bcd", "Subscription Management"),
    description: t("a8c659f66456", "Monitor and manage all user subscriptions"),
    openGraph: {
      ...metadata.openGraph,
      title: t("e8c1fbee141d", "Subscription Management"),
      description: t(
        "04705fda0cbf",
        "Monitor and manage all user subscriptions",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("feac3ec25b7a", "Subscription Management"),
      description: t(
        "25d0e638c25c",
        "Monitor and manage all user subscriptions",
      ),
    },
  };
}
export default async function SubscriptionsPage() {
  const { t } = await getServerTranslations();
  await requireAdmin();
  const initialTableData = await getSubscriptions({});
  return (
    <DashboardPageWrapper
      title={<>{t("1282ce5222ea", "Subscription Management")}</>}
      parentTitle={<>{t("04698bc5e784", "Admin Dashboard")}</>}
      parentUrl="/dashboard/admin"
    >
      <Suspense fallback={<StatsCardsSkeleton />}>
        <SubscriptionStatsCards />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>{t("871178931506", "All Subscriptions")}</CardTitle>
          <CardDescription>
            {t("d8d425f405d7", "View and manage user subscriptions")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionManagementTable
            initialData={initialTableData.data}
            initialPagination={initialTableData.pagination}
          />
        </CardContent>
      </Card>
    </DashboardPageWrapper>
  );
}
