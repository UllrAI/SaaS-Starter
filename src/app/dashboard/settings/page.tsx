import React from "react";
import { redirect } from "next/navigation";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { AccountPage } from "./_components/account-page";
import { AppearancePage } from "./_components/appearance-page";
import { DeveloperAccessSection } from "./_components/developer-access-section";
import { createMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const metadata = createMetadata({});

  return {
    ...metadata,
    title: "Settings",
    description: "Manage your account profile and dashboard appearance.",
    openGraph: {
      ...metadata.openGraph,
      title: "Settings",
      description: "Manage your account profile and dashboard appearance.",
    },
    twitter: {
      ...metadata.twitter,
      title: "Settings",
      description: "Manage your account profile and dashboard appearance.",
    },
  };
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
      title={<>Settings</>}
      description={<>Manage your account profile and dashboard appearance.</>}
    >
      <section className="space-y-8">
        <AccountPage />
        <AppearancePage />
        <DeveloperAccessSection />
      </section>
    </DashboardPageWrapper>
  );
}
