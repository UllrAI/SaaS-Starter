import { requireAdmin } from "@/lib/auth/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardPageWrapper } from "../../_components/dashboard-page-wrapper";
import { createMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import { SubscriptionStatsCards } from "./_components/subscription-stats-cards";
import { SubscriptionManagementTable } from "./_components/subscription-management-table";
import { StatsCardsSkeleton } from "../_components/stats-cards-skeleton";
import { getSubscriptions } from "@/lib/actions/admin";

export const metadata = createMetadata({
  title: "Subscription Management",
  description: "Monitor and manage all user subscriptions",
});

export default async function SubscriptionsPage() {
  await requireAdmin();
  const initialTableData = await getSubscriptions({});

  return (
    <DashboardPageWrapper
      title="Subscription Management"
      parentTitle="Admin Dashboard"
      parentUrl="/dashboard/admin"
    >
      <Suspense fallback={<StatsCardsSkeleton />}>
        <SubscriptionStatsCards />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>View and manage user subscriptions</CardDescription>
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
