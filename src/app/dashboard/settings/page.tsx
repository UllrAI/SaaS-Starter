import React from "react";
import { redirect } from "next/navigation";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { AccountPage } from "./_components/account-page";
import { AppearancePage } from "./_components/appearance-page";
import { createLocalizedMetadata } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return createLocalizedMetadata({
    en: {
      title: "Settings",
      description: "Manage your account profile and dashboard appearance.",
    },
    "zh-Hans": {
      title: "设置",
      description: "管理您的账户资料与控制台外观。",
    },
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
