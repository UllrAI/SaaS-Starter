import { useTranslation } from "@/lib/i18n/translation/client";
import { getServerTranslations } from "@/lib/i18n/translation/server";
import React from "react";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { AccountPage } from "./_components/account-page";
import { AppearancePage } from "./_components/appearance-page";
import { DeveloperAccessCard } from "./_components/developer-access-card";
import { createMetadataDefaults } from "@/lib/metadata";
export async function generateMetadata() {
  const { t } = await getServerTranslations();
  const metadata = createMetadataDefaults();
  return {
    ...metadata,
    title: t("1d469220fba5", "Settings"),
    description: t(
      "690d7a2763db",
      "Manage your account profile and dashboard appearance.",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("15a359ec2f5c", "Settings"),
      description: t(
        "e417153fb3ac",
        "Manage your account profile and dashboard appearance.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("036cfbaf7a0e", "Settings"),
      description: t(
        "05b8e29457ac",
        "Manage your account profile and dashboard appearance.",
      ),
    },
  };
}
export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <DashboardPageWrapper
      title={<>{t("6c942331684c", "Settings")}</>}
      description={
        <>
          {t(
            "40cffcff801b",
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
