import React from "react";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { Settings } from "./_components/settings";
import {
  getUserSubscription,
  getUserPayments,
} from "@/lib/database/subscription";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Settings",
  description: "Manage your account and subscription settings.",
});

export default async function SettingsPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  // Parallel data fetching for better performance (removed activeSessions fetch)
  const [subscription, payments] = await Promise.all([
    session?.user?.id
      ? getUserSubscription(session.user.id)
      : Promise.resolve(null),
    session?.user?.id
      ? getUserPayments(session.user.id, 20)
      : Promise.resolve([]),
  ]);

  return (
    <DashboardPageWrapper title="Settings">
      <Settings
        session={session}
        subscription={subscription}
        payments={payments}
      />
    </DashboardPageWrapper>
  );
}
