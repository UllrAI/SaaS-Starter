import React from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { createMetadata } from "@/lib/metadata";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import {
  getUserPayments,
  getUserSubscription,
} from "@/lib/database/subscription";
import { BillingOverview } from "./_components/billing-overview";

export const metadata = createMetadata({
  title: "Billing",
  description: "Manage your subscription plan and billing history.",
});

export default async function DashboardBillingPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

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
