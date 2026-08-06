import { useTranslation } from "@/lib/i18n/translation/client";
import { getServerTranslations } from "@/lib/i18n/translation/server";
import React from "react";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { DeveloperAccessSections } from "./_components/developer-access-sections";
import { createMetadataDefaults } from "@/lib/metadata";
export async function generateMetadata() {
  const { locale, t } = await getServerTranslations();
  const metadata = createMetadataDefaults({ locale });
  return {
    ...metadata,
    title: t("device_developer_access"),
    description: t("device_manage_access_description"),
    openGraph: {
      ...metadata.openGraph,
      title: t("device_developer_access"),
      description: t("device_manage_access_description"),
    },
    twitter: {
      ...metadata.twitter,
      title: t("device_developer_access"),
      description: t("device_manage_access_description"),
    },
  };
}
export default function DeveloperAccessPage() {
  const { t } = useTranslation();
  return (
    <DashboardPageWrapper
      title={<>{t("device_developer_access")}</>}
      description={<>{t("device_manage_api_keys_cli_sessions_agent")}</>}
    >
      <DeveloperAccessSections />
    </DashboardPageWrapper>
  );
}
