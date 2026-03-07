import React from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import {
  getUserPayments,
  getUserSubscription,
} from "@/lib/database/subscription";
import { BillingOverview } from "./_components/billing-overview";
import { createPageMetadata } from "@/lib/i18n/page-metadata";

async function BillingPageMetadataTitle() {
  return <>Billing</>;
}

async function BillingPageMetadataDescription() {
  return <>Manage your subscription plan and billing history.</>;
}

export async function generateMetadata() {
  return createPageMetadata({
    title: BillingPageMetadataTitle,
    description: BillingPageMetadataDescription,
  });
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
      title="Billing"
      description="Manage your subscription, plan status, and payment history."
    >
      <BillingOverview subscription={subscription} payments={payments} />
    </DashboardPageWrapper>
  );
}
