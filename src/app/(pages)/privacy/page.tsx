import { getServerTranslations } from "@/lib/i18n/translation/server";
import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { LocalizedLink as Link } from "@/components/localized-link";
import { GITHUB_DISCUSSIONS_URL, PRIVACY_EMAIL } from "@/lib/config/constants";
import { Shield } from "lucide-react";
import {
  createLocalizedAlternates,
  createMetadataDefaults,
} from "@/lib/metadata";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
import { ReadingContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import {
  PageIntro,
  PageIntroDescription,
  PageIntroHeading,
} from "@/components/layout/page-intro";
export async function buildPrivacyMetadata(locale: SupportedLocale) {
  const { t } = await getServerTranslations({ locale });
  const metadata = createMetadataDefaults({
    alternates: createLocalizedAlternates("/privacy", locale),
    locale,
  });
  return {
    ...metadata,
    title: t("3241be1d593e", "Privacy Policy"),
    description: t(
      "f246eba3dfa3",
      "Learn how we collect, use, and protect your personal information.",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("fada1f837d85", "Privacy Policy"),
      description: t(
        "b4f31d63dabc",
        "Learn how we collect, use, and protect your personal information.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("80b31617d830", "Privacy Policy"),
      description: t(
        "b80322b6f433",
        "Learn how we collect, use, and protect your personal information.",
      ),
    },
  };
}
export function generateMetadata() {
  return buildPrivacyMetadata(SOURCE_LOCALE);
}
export default function PrivacyPage({
  locale = SOURCE_LOCALE,
}: {
  locale?: SupportedLocale;
} = {}) {
  const { t } = getStaticTranslations(locale);
  const privacySections = [
    {
      id: "information-collection",
      title: <>{t("938df6ba7b69", "Information We Collect")}</>,
      items: [
        <>{t("23dfa7edf67f", "Account information (name, email, password)")}</>,
        <>{t("e62f1fc1725b", "Usage data and analytics")}</>,
        <>{t("54db075a234c", "Device and browser information")}</>,
        <>
          {t(
            "a794f7530555",
            "Payment information (processed securely by our payment providers)",
          )}
        </>,
        <>{t("648d61af9dc8", "Communications with our support team")}</>,
      ],
    },
    {
      id: "information-use",
      title: <>{t("04137d52bcda", "How We Use Your Information")}</>,
      items: [
        <>{t("f3e181d15d2a", "Provide and maintain our services")}</>,
        <>
          {t(
            "1f516ca4ec6e",
            "Process transactions and send related information",
          )}
        </>,
        <>{t("24a062f61a1b", "Send technical notices and support messages")}</>,
        <>
          {t("00c1cd3bf46e", "Improve our services and develop new features")}
        </>,
        <>{t("f69042a96f8b", "Comply with legal obligations")}</>,
      ],
    },
    {
      id: "information-sharing",
      title: <>{t("1062bfa4f0ab", "Information Sharing")}</>,
      items: [
        <>{t("b1c94c5e73dc", "We do not sell your personal information")}</>,
        <>
          {t("f796b939ddff", "Service providers who assist in our operations")}
        </>,
        <>{t("aa6fa6a5315e", "Legal compliance when required by law")}</>,
        <>{t("553f1c5bc60d", "Business transfers (mergers, acquisitions)")}</>,
        <>{t("ceb4a569a23b", "With your explicit consent")}</>,
      ],
    },
    {
      id: "data-security",
      title: <>{t("be7b4656abf0", "Data Security")}</>,
      items: [
        <>
          {t(
            "a2927f0b5927",
            "Industry-standard encryption for data in transit and at rest",
          )}
        </>,
        <>{t("d2b19d96c5e2", "Regular security audits and assessments")}</>,
        <>{t("949d2a3a6370", "Access controls and authentication measures")}</>,
        <>{t("495f2e0bd665", "Secure data centers with physical security")}</>,
        <>{t("bd0e1a550839", "Employee training on data protection")}</>,
      ],
    },
    {
      id: "your-rights",
      title: <>{t("4e394d5a10fb", "Your Rights")}</>,
      items: [
        <>{t("328c643c1ef7", "Access your personal information")}</>,
        <>{t("4bb8bf12a89e", "Correct inaccurate information")}</>,
        <>{t("d1a9241a8d89", "Delete your account and data")}</>,
        <>{t("741c4509b2de", "Export your data")}</>,
        <>{t("9bf75005d1be", "Opt-out of marketing communications")}</>,
      ],
    },
    {
      id: "data-retention",
      title: <>{t("4ba8a78738cc", "Data Retention")}</>,
      items: [
        <>
          {t(
            "8a6dede22cd7",
            "Account data: Retained while your account is active",
          )}
        </>,
        <>
          {t(
            "dc7e3e511c0f",
            "Usage data: Retained for up to 2 years for analytics",
          )}
        </>,
        <>
          {t("c4285857175a", "Support communications: Retained for 3 years")}
        </>,
        <>
          {t(
            "01f5582e89f0",
            "Legal compliance: As required by applicable laws",
          )}
        </>,
        <>
          {t(
            "f1c3b9a31f33",
            "Deleted data: Permanently removed within 30 days",
          )}
        </>,
      ],
    },
  ];
  return (
    <div className="py-16">
      <ReadingContainer>
        <PageIntro
          className="mb-12"
          badge={
            <Badge className="border-border bg-background/50 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
              <Shield className="text-muted-foreground mr-2 h-3 w-3" />
              <span className="text-muted-foreground font-mono">
                {t("abf77699d9da", "PRIVACY.md")}
              </span>
            </Badge>
          }
        >
          <PageIntroHeading>
            {t("40b4715cf695", "Privacy Policy")}
          </PageIntroHeading>
          <PageIntroDescription className="mb-10">
            {t(
              "4a613b579c0b",
              "We are committed to protecting your privacy and ensuring the security of your personal information. This policy explains how we collect, use, and safeguard your data.",
            )}
          </PageIntroDescription>
          <div className="text-muted-foreground text-sm">
            <p>{t("3f11649275f6", "Last updated: December 2024")}</p>
            <p>{t("67dd0961970d", "Effective: December 1, 2024")}</p>
          </div>
        </PageIntro>

        <div className="space-y-8">
          {privacySections.map((section) => {
            return (
              <div key={section.id} id={section.id}>
                <h2 className="mb-4 text-2xl font-semibold">{section.title}</h2>
                <ul className="space-y-2 pl-5">
                  {section.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="text-muted-foreground list-disc"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-12">
          <h2 className="mb-4 text-2xl font-semibold">
            {t("91ccd992e4c7", "Questions About This Policy?")}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t(
              "b90889e8adc8",
              "If you have any questions about this Privacy Policy or our data practices, please don't hesitate to contact us.",
            )}
          </p>
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              <strong>{t("2318e79598d2", "Email:")}</strong> {PRIVACY_EMAIL}
            </p>
            <p>
              <strong>{t("7ba1a8e44572", "Support:")}</strong>{" "}
              <Link
                href="/contact"
                locale={locale}
                className="underline underline-offset-4"
              >
                {t("3f5b18c72fe6", "Contact page")}
              </Link>
            </p>
            <p>
              <strong>{t("8ff6377c16e1", "Community:")}</strong>{" "}
              <a
                href={GITHUB_DISCUSSIONS_URL}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                {t("b81153d4b0b3", "GitHub Discussions")}
              </a>
            </p>
          </div>
        </div>

        <div className="text-muted-foreground mt-12 border-t pt-8 text-center text-sm">
          <p>
            {t(
              "d3eff3488090",
              "This Privacy Policy is governed by the laws of the United States. We reserve the right to update this policy at any time. Material changes will be communicated via email or through our service.",
            )}
          </p>
        </div>
      </ReadingContainer>
    </div>
  );
}
