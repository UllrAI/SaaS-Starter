import React from "react";
import { DashboardPageWrapper } from "../_components/dashboard-page-wrapper";
import { DeveloperAccessSections } from "./_components/developer-access-sections";
import { createMetadataDefaults } from "@/lib/metadata";

export async function generateMetadata() {
  const metadata = createMetadataDefaults();

  return {
    ...metadata,
    title: "Developer Access",
    description:
      "Manage API keys, CLI sessions, and agent-friendly access to your SaaS app.",
    openGraph: {
      ...metadata.openGraph,
      title: "Developer Access",
      description:
        "Manage API keys, CLI sessions, and agent-friendly access to your SaaS app.",
    },
    twitter: {
      ...metadata.twitter,
      title: "Developer Access",
      description:
        "Manage API keys, CLI sessions, and agent-friendly access to your SaaS app.",
    },
  };
}

export default function DeveloperAccessPage() {
  return (
    <DashboardPageWrapper
      title={<>Developer Access</>}
      description={
        <>
          Manage API keys, CLI sessions, and agent-friendly access from one
          place.
        </>
      }
    >
      <DeveloperAccessSections />
    </DashboardPageWrapper>
  );
}
