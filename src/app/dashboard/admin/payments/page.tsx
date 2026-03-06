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
import { PaymentStatsCards } from "./_components/payment-stats-cards";
import { PaymentManagementTable } from "./_components/payment-management-table";
import { StatsCardsSkeleton } from "../_components/stats-cards-skeleton";
import { getPayments } from "@/lib/actions/admin";
import { createPageMetadata } from "@/lib/i18n/page-metadata";

async function PaymentManagementMetadataTitle() {
  return <>Payment Management</>;
}

async function PaymentManagementMetadataDescription() {
  return <>Monitor and manage all payment transactions</>;
}

export async function generateMetadata() {
  return createPageMetadata({
    title: PaymentManagementMetadataTitle,
    description: PaymentManagementMetadataDescription,
  });
}

export default async function PaymentsPage() {
  await requireAdmin();
  const initialTableData = await getPayments({});

  return (
    <DashboardPageWrapper
      title="Payment Management"
      parentTitle="Admin Dashboard"
      parentUrl="/dashboard/admin"
    >
      <Suspense fallback={<StatsCardsSkeleton />}>
        <PaymentStatsCards />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
          <CardDescription>
            View and manage payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentManagementTable
            initialData={initialTableData.data}
            initialPagination={initialTableData.pagination}
          />
        </CardContent>
      </Card>
    </DashboardPageWrapper>
  );
}
