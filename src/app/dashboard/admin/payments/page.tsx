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
import { getPayments } from "@/lib/actions/admin/payments";
import { createMetadataDefaults } from "@/lib/metadata";
import { SITE_CONFIG } from "@/lib/config/site";
import { notFound } from "next/navigation";
export async function generateMetadata() {
  const { locale, t } = await getServerTranslations();
  const metadata = createMetadataDefaults({ locale });
  return {
    ...metadata,
    title: t("admin_payment_management", "Payment Management"),
    description: t(
      "admin_monitor_manage_all_payment_transactions",
      "Monitor and manage all payment transactions",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("admin_payment_management", "Payment Management"),
      description: t(
        "admin_monitor_manage_all_payment_transactions",
        "Monitor and manage all payment transactions",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("admin_payment_management", "Payment Management"),
      description: t(
        "admin_monitor_manage_all_payment_transactions_description",
        "Monitor and manage all payment transactions",
      ),
    },
  };
}
export default async function PaymentsPage() {
  if (!SITE_CONFIG.features.billing) {
    notFound();
  }

  const { t } = await getServerTranslations();
  await requireAdmin();
  const initialTableData = await getPayments({});
  return (
    <DashboardPageWrapper
      title={<>{t("admin_payment_management", "Payment Management")}</>}
      parentTitle={<>{t("admin_dashboard", "Admin Dashboard")}</>}
      parentUrl="/dashboard/admin"
    >
      <Suspense fallback={<StatsCardsSkeleton />}>
        <PaymentStatsCards />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin_all_payments", "All Payments")}</CardTitle>
          <CardDescription>
            {t(
              "admin_view_manage_payment_transactions",
              "View and manage payment transactions",
            )}
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
