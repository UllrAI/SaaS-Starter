import React from "react";
import { redirect } from "next/navigation";
import { createMetadata } from "@/lib/metadata";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { AccountPage } from "./_components/account-page";
import { AppearancePage } from "./_components/appearance-page";

export const metadata = createMetadata({
  title: "Settings",
  description: "Manage your account profile and dashboard appearance.",
});

interface SettingsPageProps {
  searchParams: Promise<{ page?: string }>;
}

const legacySettingsRouteMap: Record<string, string> = {
  account: "/dashboard/settings",
  appearance: "/dashboard/settings",
  notifications: "/dashboard/settings",
  billing: "/dashboard/billing",
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const { page } = await searchParams;
  const legacyTarget = page ? legacySettingsRouteMap[page] : undefined;

  if (legacyTarget) {
    redirect(legacyTarget);
  }

  return (
    <DashboardPageWrapper
      title="Settings"
      description="Manage your account profile and personalize dashboard appearance."
    >
      <section className="space-y-8">
        <AccountPage />
        <AppearancePage />
      </section>
    </DashboardPageWrapper>
  );
}
