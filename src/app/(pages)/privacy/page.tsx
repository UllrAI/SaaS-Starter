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
    title: t("legal_privacy_policy", "Privacy Policy"),
    description: t(
      "legal_learn_how_we_collect_use_protect",
      "Learn how we collect, use, and protect your personal information.",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("legal_privacy_policy", "Privacy Policy"),
      description: t(
        "legal_learn_how_we_collect_use_protect",
        "Learn how we collect, use, and protect your personal information.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("legal_privacy_policy", "Privacy Policy"),
      description: t(
        "legal_learn_how_we_collect_use_protect",
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
      title: <>{t("legal_information_we_collect", "Information We Collect")}</>,
      items: [
        <>
          {t(
            "legal_account_information_name_email_password",
            "Account information (name, email, password)",
          )}
        </>,
        <>{t("legal_usage_data_analytics", "Usage data and analytics")}</>,
        <>
          {t(
            "legal_device_browser_information",
            "Device and browser information",
          )}
        </>,
        <>
          {t(
            "legal_payment_information_processed_securely_providers",
            "Payment information (processed securely by our payment providers)",
          )}
        </>,
        <>
          {t(
            "legal_communications_support_team",
            "Communications with our support team",
          )}
        </>,
      ],
    },
    {
      id: "information-use",
      title: (
        <>{t("legal_how_we_use_information", "How We Use Your Information")}</>
      ),
      items: [
        <>
          {t(
            "legal_provide_maintain_services",
            "Provide and maintain our services",
          )}
        </>,
        <>
          {t(
            "legal_process_transactions_send_related_information",
            "Process transactions and send related information",
          )}
        </>,
        <>
          {t(
            "legal_send_technical_notices_support_messages",
            "Send technical notices and support messages",
          )}
        </>,
        <>
          {t(
            "legal_improve_services_develop_new_features",
            "Improve our services and develop new features",
          )}
        </>,
        <>
          {t("legal_comply_legal_obligations", "Comply with legal obligations")}
        </>,
      ],
    },
    {
      id: "information-sharing",
      title: <>{t("legal_information_sharing", "Information Sharing")}</>,
      items: [
        <>
          {t(
            "legal_we_do_not_sell_personal_information",
            "We do not sell your personal information",
          )}
        </>,
        <>
          {t(
            "legal_service_providers_who_assist_in_operations",
            "Service providers who assist in our operations",
          )}
        </>,
        <>
          {t(
            "legal_compliance_when_required_law",
            "Legal compliance when required by law",
          )}
        </>,
        <>
          {t(
            "legal_business_transfers_mergers_acquisitions",
            "Business transfers (mergers, acquisitions)",
          )}
        </>,
        <>{t("legal_explicit_consent", "With your explicit consent")}</>,
      ],
    },
    {
      id: "data-security",
      title: <>{t("legal_data_security", "Data Security")}</>,
      items: [
        <>
          {t(
            "legal_industry_standard_encryption_data_in_transit",
            "Industry-standard encryption for data in transit and at rest",
          )}
        </>,
        <>
          {t(
            "legal_regular_security_audits_assessments",
            "Regular security audits and assessments",
          )}
        </>,
        <>
          {t(
            "legal_access_controls_authentication_measures",
            "Access controls and authentication measures",
          )}
        </>,
        <>
          {t(
            "legal_secure_data_centers_physical_security",
            "Secure data centers with physical security",
          )}
        </>,
        <>
          {t(
            "legal_employee_training_data_protection",
            "Employee training on data protection",
          )}
        </>,
      ],
    },
    {
      id: "your-rights",
      title: <>{t("legal_rights", "Your Rights")}</>,
      items: [
        <>
          {t(
            "legal_access_personal_information",
            "Access your personal information",
          )}
        </>,
        <>
          {t(
            "legal_correct_inaccurate_information",
            "Correct inaccurate information",
          )}
        </>,
        <>{t("legal_delete_account_data", "Delete your account and data")}</>,
        <>{t("legal_export_data", "Export your data")}</>,
        <>
          {t(
            "legal_opt_out_marketing_communications",
            "Opt-out of marketing communications",
          )}
        </>,
      ],
    },
    {
      id: "data-retention",
      title: <>{t("legal_data_retention", "Data Retention")}</>,
      items: [
        <>
          {t(
            "legal_account_data_retained_while_active",
            "Account data: Retained while your account is active",
          )}
        </>,
        <>
          {t(
            "legal_usage_data_retained_up_2_years",
            "Usage data: Retained for up to 2 years for analytics",
          )}
        </>,
        <>
          {t(
            "legal_support_communications_retained_3_years",
            "Support communications: Retained for 3 years",
          )}
        </>,
        <>
          {t(
            "legal_compliance_as_required_applicable_laws",
            "Legal compliance: As required by applicable laws",
          )}
        </>,
        <>
          {t(
            "legal_deleted_data_permanently_removed_within_30",
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
                {t("legal_privacy_md", "PRIVACY.md")}
              </span>
            </Badge>
          }
        >
          <PageIntroHeading>
            {t("legal_privacy_policy", "Privacy Policy")}
          </PageIntroHeading>
          <PageIntroDescription className="mb-10">
            {t(
              "legal_we_committed_protecting_privacy_ensuring_security",
              "We are committed to protecting your privacy and ensuring the security of your personal information. This policy explains how we collect, use, and safeguard your data.",
            )}
          </PageIntroDescription>
          <div className="text-muted-foreground text-sm">
            <p>
              {t(
                "legal_last_updated_december_2024",
                "Last updated: December 2024",
              )}
            </p>
            <p>
              {t(
                "legal_effective_december_1_2024",
                "Effective: December 1, 2024",
              )}
            </p>
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
            {t("legal_questions_about_policy", "Questions About This Policy?")}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t(
              "legal_if_you_have_any_questions_about_privacy",
              "If you have any questions about this Privacy Policy or our data practices, please don't hesitate to contact us.",
            )}
          </p>
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              <strong>{t("legal_email", "Email:")}</strong> {PRIVACY_EMAIL}
            </p>
            <p>
              <strong>{t("legal_support", "Support:")}</strong>{" "}
              <Link
                href="/contact"
                locale={locale}
                className="underline underline-offset-4"
              >
                {t("legal_contact_page", "Contact page")}
              </Link>
            </p>
            <p>
              <strong>{t("legal_community", "Community:")}</strong>{" "}
              <a
                href={GITHUB_DISCUSSIONS_URL}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                {t("legal_git_hub_discussions", "GitHub Discussions")}
              </a>
            </p>
          </div>
        </div>

        <div className="text-muted-foreground mt-12 border-t pt-8 text-center text-sm">
          <p>
            {t(
              "legal_privacy_policy_governed_laws_united_states",
              "This Privacy Policy is governed by the laws of the United States. We reserve the right to update this policy at any time. Material changes will be communicated via email or through our service.",
            )}
          </p>
        </div>
      </ReadingContainer>
    </div>
  );
}
