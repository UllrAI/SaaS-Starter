import React from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import {
  getUserPayments,
  getUserSubscription,
} from "@/lib/database/subscription";
import { BillingOverview } from "./_components/billing-overview";
import { createMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const metadata = createMetadata({});

  return {
    ...metadata,
    title: "Billing",
    description: "Manage your subscription plan and billing history.",
    openGraph: {
      ...metadata.openGraph,
      title: "Billing",
      description: "Manage your subscription plan and billing history.",
    },
    twitter: {
      ...metadata.twitter,
      title: "Billing",
      description: "Manage your subscription plan and billing history.",
    },
  };
}

export default async function DashboardBillingPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
    query: {
      disableCookieCache: true,
    },
  });

  const [subscription, payments] = await Promise.all([
    session?.user?.id
      ? getUserSubscription(session.user.id)
      : Promise.resolve(null),
    session?.user?.id
      ? getUserPayments(session.user.id, 20)
      : Promise.resolve([]),
  ]);

  return (
    <DashboardPageWrapper
      title={<>Billing</>}
      description={<>Manage your subscription plan and billing history.</>}
    >
      <BillingOverview subscription={subscription} payments={payments} />
    </DashboardPageWrapper>
  );
}
