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
    title: t("settings_title"),
    description: t("settings_manage_profile"),
    openGraph: {
      ...metadata.openGraph,
      title: t("settings_title"),
      description: t("settings_manage_profile_description"),
    },
    twitter: {
      ...metadata.twitter,
      title: t("settings_title"),
      description: t("settings_manage_profile"),
    },
  };
}
export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <DashboardPageWrapper
      title={<>{t("settings_title")}</>}
      description={<>{t("settings_manage_profile")}</>}
    >
      <section className="space-y-8">
        <AccountPage />
        <AppearancePage />
        <DeveloperAccessCard />
      </section>
    </DashboardPageWrapper>
  );
}
