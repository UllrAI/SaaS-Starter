import { getServerTranslations } from "@/lib/i18n/translation/server";
import React from "react";
import { headers } from "next/headers";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import {
  getUserPayments,
  getUserProductEntitlement,
  getUserSubscription,
} from "@/lib/database/subscription";
import { BillingOverview } from "./_components/billing-overview";
import { createMetadataDefaults } from "@/lib/metadata";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
export async function generateMetadata() {
  const { locale, t } = await getServerTranslations();
  const metadata = createMetadataDefaults({ locale });
  return {
    ...metadata,
    title: t("f8de466fe579", "Billing"),
    description: t(
      "8673f487aefe",
      "Manage your subscription plan and billing history.",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("0b28c0771d77", "Billing"),
      description: t(
        "56584bca3382",
        "Manage your subscription plan and billing history.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("1adf52b23f94", "Billing"),
      description: t(
        "ac71b3ceefe3",
        "Manage your subscription plan and billing history.",
      ),
    },
  };
}
export default async function DashboardBillingPage() {
  const { t } = await getServerTranslations();
  const requestHeaders = await headers();
  const session = await getAuthSessionFromHeaders(requestHeaders);
  const [subscription, entitlement, payments] = await Promise.all([
    session?.user?.id
      ? getUserSubscription(session.user.id)
      : Promise.resolve(null),
    session?.user?.id
      ? getUserProductEntitlement(session.user.id)
      : Promise.resolve(null),
    session?.user?.id
      ? getUserPayments(session.user.id, 20)
      : Promise.resolve([]),
  ]);
  return (
    <DashboardPageWrapper
      title={<>{t("ffd1a6c2fa20", "Billing")}</>}
      description={
        <>
          {t(
            "65bb98f33f24",
            "Manage your subscription plan and billing history.",
          )}
        </>
      }
    >
      <BillingOverview
        subscription={subscription}
        entitlement={entitlement}
        payments={payments}
      />
    </DashboardPageWrapper>
  );
}
