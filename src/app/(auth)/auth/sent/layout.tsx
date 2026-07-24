import { getServerTranslations } from "@/lib/i18n/translation/server";
import { createMetadataDefaults } from "@/lib/metadata";
export async function generateMetadata() {
  const { locale, t } = await getServerTranslations();
  const metadata = createMetadataDefaults({ locale });
  return {
    ...metadata,
    title: t("e314d9b15e50", "Check Your Email - Magic Link Sent"),
    description: t(
      "b4132032f9d3",
      "We've sent you a secure magic link to access your account",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("41a7e211067d", "Check Your Email - Magic Link Sent"),
      description: t(
        "7902b7da7743",
        "We've sent you a secure magic link to access your account",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("a1604782a623", "Check Your Email - Magic Link Sent"),
      description: t(
        "18eba6f4493c",
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
