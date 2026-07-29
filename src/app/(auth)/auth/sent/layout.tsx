import { getServerTranslations } from "@/lib/i18n/translation/server";
import { createMetadataDefaults } from "@/lib/metadata";
export async function generateMetadata() {
  const { locale, t } = await getServerTranslations();
  const metadata = createMetadataDefaults({ locale });
  return {
    ...metadata,
    title: t(
      "auth_check_email_magic_link_sent_title",
      "Check Your Email - Magic Link Sent",
    ),
    description: t(
      "auth_weve_sent_you_secure_magic_link_description",
      "We've sent you a secure magic link to access your account",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t(
        "auth_check_email_magic_link_sent",
        "Check Your Email - Magic Link Sent",
      ),
      description: t(
        "auth_weve_sent_you_secure_magic_link",
        "We've sent you a secure magic link to access your account",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t(
        "auth_check_email_magic_link_sent",
        "Check Your Email - Magic Link Sent",
      ),
      description: t(
        "auth_weve_sent_you_secure_magic_link",
        "We've sent you a secure magic link to access your account",
      ),
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
