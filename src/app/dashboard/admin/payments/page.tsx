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
import { PaymentStatsCards } from "./_components/payment-stats-cards";
import { PaymentManagementTable } from "./_components/payment-management-table";
import { StatsCardsSkeleton } from "../_components/stats-cards-skeleton";
import { getPayments } from "@/lib/actions/admin";
import { createMetadataDefaults } from "@/lib/metadata";
export async function generateMetadata() {
  const { t } = await getServerTranslations();
  const metadata = createMetadataDefaults();
  return {
    ...metadata,
    title: t("4630c4ba4580", "Payment Management"),
    description: t(
      "3f7482df5e5e",
      "Monitor and manage all payment transactions",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("23064ec7ab3e", "Payment Management"),
      description: t(
        "18201868f4b1",
        "Monitor and manage all payment transactions",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("91c58a8dbf69", "Payment Management"),
      description: t(
        "d30ce9379d2d",
        "Monitor and manage all payment transactions",
      ),
    },
  };
}
export default async function PaymentsPage() {
  const { t } = await getServerTranslations();
  await requireAdmin();
  const initialTableData = await getPayments({});
  return (
    <DashboardPageWrapper
      title={<>{t("886ed7928313", "Payment Management")}</>}
      parentTitle={<>{t("7a0af3ad335d", "Admin Dashboard")}</>}
      parentUrl="/dashboard/admin"
    >
      <Suspense fallback={<StatsCardsSkeleton />}>
        <PaymentStatsCards />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>{t("0e3e5ecfea61", "All Payments")}</CardTitle>
          <CardDescription>
            {t("085a2670c1b2", "View and manage payment transactions")}
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
