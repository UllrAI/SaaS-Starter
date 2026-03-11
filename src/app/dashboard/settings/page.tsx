import React from "react";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { AccountPage } from "./_components/account-page";
import { AppearancePage } from "./_components/appearance-page";
import { DeveloperAccessCard } from "./_components/developer-access-card";
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

export default function SettingsPage() {
  return (
    <DashboardPageWrapper
      title={<>Settings</>}
      description={<>Manage your account profile and dashboard appearance.</>}
    >
      <section className="space-y-8">
        <AccountPage />
        <AppearancePage />
        <DeveloperAccessCard />
      </section>
    </DashboardPageWrapper>
  );
}
