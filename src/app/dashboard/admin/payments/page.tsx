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
import { createLocalizedMetadata } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return createLocalizedMetadata({
    en: {
      title: "Payment Management",
      description: "Monitor and manage all payment transactions",
    },
    "zh-Hans": {
      title: "支付管理",
      description: "监控并管理所有支付交易记录。",
    },
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
