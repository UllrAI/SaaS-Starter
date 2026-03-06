import React from "react";
import { redirect } from "next/navigation";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { AccountPage } from "./_components/account-page";
import { AppearancePage } from "./_components/appearance-page";
import { createPageMetadata } from "@/lib/i18n/page-metadata";

async function SettingsPageMetadataTitle() {
  return <>Settings</>;
}

async function SettingsPageMetadataDescription() {
  return <>Manage your account profile and dashboard appearance.</>;
}

export async function generateMetadata() {
  return createPageMetadata({
    title: SettingsPageMetadataTitle,
    description: SettingsPageMetadataDescription,
  });
}

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
