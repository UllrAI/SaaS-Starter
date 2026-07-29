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
import { getSubscriptions } from "@/lib/actions/admin/subscriptions";
import { createMetadataDefaults } from "@/lib/metadata";
import { SITE_CONFIG } from "@/lib/config/site";
import { notFound } from "next/navigation";
export async function generateMetadata() {
  const { locale, t } = await getServerTranslations();
  const metadata = createMetadataDefaults({ locale });
  return {
    ...metadata,
    title: t("admin_subscription_management", "Subscription Management"),
    description: t(
      "admin_monitor_manage_all_user_subscriptions_description",
      "Monitor and manage all user subscriptions",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("admin_subscription_management", "Subscription Management"),
      description: t(
        "admin_monitor_manage_all_user_subscriptions",
        "Monitor and manage all user subscriptions",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("admin_subscription_management", "Subscription Management"),
      description: t(
        "admin_monitor_manage_all_user_subscriptions",
        "Monitor and manage all user subscriptions",
      ),
    },
  };
}
export default async function SubscriptionsPage() {
  if (!SITE_CONFIG.features.billing) {
    notFound();
  }

  const { t } = await getServerTranslations();
  await requireAdmin();
  const initialTableData = await getSubscriptions({});
  return (
    <DashboardPageWrapper
      title={
        <>{t("admin_subscription_management", "Subscription Management")}</>
      }
      parentTitle={<>{t("admin_dashboard", "Admin Dashboard")}</>}
      parentUrl="/dashboard/admin"
    >
      <Suspense fallback={<StatsCardsSkeleton />}>
        <SubscriptionStatsCards />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("admin_all_subscriptions", "All Subscriptions")}
          </CardTitle>
          <CardDescription>
            {t(
              "admin_view_manage_user_subscriptions",
              "View and manage user subscriptions",
            )}
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
