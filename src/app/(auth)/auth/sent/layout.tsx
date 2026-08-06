import { getServerTranslations } from "@/lib/i18n/translation/server";
import { createMetadataDefaults } from "@/lib/metadata";
export async function generateMetadata() {
  const { locale, t } = await getServerTranslations();
  const metadata = createMetadataDefaults({ locale });
  return {
    ...metadata,
    title: t("auth_check_email_magic_link_sent_title"),
    description: t("auth_magic_link_sent_description"),
    openGraph: {
      ...metadata.openGraph,
      title: t("auth_check_email_magic_link_sent"),
      description: t("auth_weve_sent_you_secure_magic_link"),
    },
    twitter: {
      ...metadata.twitter,
      title: t("auth_check_email_magic_link_sent"),
      description: t("auth_weve_sent_you_secure_magic_link"),
    },
  };
}
export default function SentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
