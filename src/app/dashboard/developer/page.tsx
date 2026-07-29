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
    title: t("device_developer_access", "Developer Access"),
    description: t(
      "device_manage_api_keys_cli_sessions_agent_description",
      "Manage API keys, CLI sessions, and agent-friendly access to your SaaS app.",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("device_developer_access", "Developer Access"),
      description: t(
        "device_manage_api_keys_cli_sessions_agent_description",
        "Manage API keys, CLI sessions, and agent-friendly access to your SaaS app.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("device_developer_access", "Developer Access"),
      description: t(
        "device_manage_api_keys_cli_sessions_agent_description",
        "Manage API keys, CLI sessions, and agent-friendly access to your SaaS app.",
      ),
    },
  };
}
export default function DeveloperAccessPage() {
  const { t } = useTranslation();
  return (
    <DashboardPageWrapper
      title={<>{t("device_developer_access", "Developer Access")}</>}
      description={
        <>
          {t(
            "device_manage_api_keys_cli_sessions_agent",
            "Manage API keys, CLI sessions, and agent-friendly access from one place.",
          )}
        </>
      }
    >
      <DeveloperAccessSections />
    </DashboardPageWrapper>
  );
}
