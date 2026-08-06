import { getServerTranslations } from "@/lib/i18n/translation/server";
import React from "react";
import { headers } from "next/headers";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import {
  getUserPaymentSummary,
  getUserPayments,
  getUserProductEntitlement,
  getUserSubscription,
} from "@/lib/database/subscription";
import { BillingOverview } from "./_components/billing-overview";
import { createMetadataDefaults } from "@/lib/metadata";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { SITE_CONFIG } from "@/lib/config/site";
import { notFound } from "next/navigation";
export async function generateMetadata() {
  const { locale, t } = await getServerTranslations();
  const metadata = createMetadataDefaults({ locale });
  return {
    ...metadata,
    title: t("billing_title_page"),
    description: t("billing_manage_plan_history"),
    openGraph: {
      ...metadata.openGraph,
      title: t("billing_title"),
      description: t("billing_manage_plan_history"),
    },
    twitter: {
      ...metadata.twitter,
      title: t("billing_title"),
      description: t("billing_manage_plan_history"),
    },
  };
}
export default async function DashboardBillingPage() {
  if (!SITE_CONFIG.features.billing) {
    notFound();
  }

  const { t } = await getServerTranslations();
  const requestHeaders = await headers();
  const session = await getAuthSessionFromHeaders(requestHeaders);
  const [subscription, entitlement, payments, successfulPaymentSummary] =
    await Promise.all([
      session?.user?.id
        ? getUserSubscription(session.user.id)
        : Promise.resolve(null),
      session?.user?.id
        ? getUserProductEntitlement(session.user.id)
        : Promise.resolve(null),
      session?.user?.id
        ? getUserPayments(session.user.id, 20)
        : Promise.resolve([]),
      session?.user?.id
        ? getUserPaymentSummary(session.user.id, "succeeded")
        : Promise.resolve({ count: 0, latestCreatedAt: null }),
    ]);
  return (
    <DashboardPageWrapper
      title={<>{t("billing_title_page")}</>}
      description={<>{t("billing_manage_plan_history")}</>}
    >
      <BillingOverview
        subscription={subscription}
        entitlement={entitlement}
        payments={payments}
        successfulPaymentCount={successfulPaymentSummary.count}
        latestSuccessfulPaymentAt={successfulPaymentSummary.latestCreatedAt}
      />
    </DashboardPageWrapper>
  );
}
