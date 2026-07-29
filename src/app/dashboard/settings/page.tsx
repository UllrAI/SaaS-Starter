import { useTranslation } from "@/lib/i18n/translation/client";
import { getServerTranslations } from "@/lib/i18n/translation/server";
import React from "react";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { AccountPage } from "./_components/account-page";
import { AppearancePage } from "./_components/appearance-page";
import { DeveloperAccessCard } from "./_components/developer-access-card";
import { createMetadataDefaults } from "@/lib/metadata";
export async function generateMetadata() {
  const { locale, t } = await getServerTranslations();
  const metadata = createMetadataDefaults({ locale });
  return {
    ...metadata,
    title: t("settings_title", "Settings"),
    description: t(
      "settings_manage_account_profile_dashboard_appearance",
      "Manage your account profile and dashboard appearance.",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("settings_title", "Settings"),
      description: t(
        "settings_manage_account_profile_dashboard_appearance_description",
        "Manage your account profile and dashboard appearance.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("settings_title", "Settings"),
      description: t(
        "settings_manage_account_profile_dashboard_appearance",
        "Manage your account profile and dashboard appearance.",
      ),
    },
  };
}
export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <DashboardPageWrapper
      title={<>{t("settings_title", "Settings")}</>}
      description={
        <>
          {t(
            "settings_manage_account_profile_dashboard_appearance",
            "Manage your account profile and dashboard appearance.",
          )}
        </>
      }
    >
      <section className="space-y-8">
        <AccountPage />
        <AppearancePage />
        <DeveloperAccessCard />
      </section>
    </DashboardPageWrapper>
  );
}
