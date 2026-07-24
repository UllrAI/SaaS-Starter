import { useTranslation } from "@/lib/i18n/translation/client";
import { getServerTranslations } from "@/lib/i18n/translation/server";
import React from "react";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { DeveloperAccessSections } from "./_components/developer-access-sections";
import { createMetadataDefaults } from "@/lib/metadata";
export async function generateMetadata() {
  const { t } = await getServerTranslations();
  const metadata = createMetadataDefaults();
  return {
    ...metadata,
    title: t("b32fd3f9981d", "Developer Access"),
    description: t(
      "7e48f78cb7d5",
      "Manage API keys, CLI sessions, and agent-friendly access to your SaaS app.",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("ac251bc0bd5f", "Developer Access"),
      description: t(
        "e70df347d6ca",
        "Manage API keys, CLI sessions, and agent-friendly access to your SaaS app.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("cdbd24f211b6", "Developer Access"),
      description: t(
        "7ba4dcfc025b",
        "Manage API keys, CLI sessions, and agent-friendly access to your SaaS app.",
      ),
    },
  };
}
export default function DeveloperAccessPage() {
  const { t } = useTranslation();
  return (
    <DashboardPageWrapper
      title={<>{t("80f8b0b042b8", "Developer Access")}</>}
      description={
        <>
          {t(
            "41ca99b17070",
            "Manage API keys, CLI sessions, and agent-friendly access from one place.",
          )}
        </>
      }
    >
      <DeveloperAccessSections />
    </DashboardPageWrapper>
  );
}
