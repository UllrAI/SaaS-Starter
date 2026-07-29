import { getServerTranslations } from "@/lib/i18n/translation/server";
import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { LocalizedLink as Link } from "@/components/localized-link";
import {
  COMPANY_NAME,
  GITHUB_DISCUSSIONS_URL,
  LEGAL_EMAIL,
} from "@/lib/config/constants";
import { FileText } from "lucide-react";
import { ReadingContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import {
  PageIntro,
  PageIntroDescription,
  PageIntroHeading,
} from "@/components/layout/page-intro";
import {
  createLocalizedAlternates,
  createMetadataDefaults,
} from "@/lib/metadata";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
export async function buildTermsMetadata(locale: SupportedLocale) {
  const { t } = await getServerTranslations({ locale });
  const metadata = createMetadataDefaults({
    alternates: createLocalizedAlternates("/terms", locale),
    locale,
  });
  return {
    ...metadata,
    title: t("legal_terms_service", "Terms of Service"),
    description: t(
      "legal_read_terms_service_understand_rights_responsibilities",
      "Read our terms of service to understand your rights and responsibilities when using the product.",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("legal_terms_service", "Terms of Service"),
      description: t(
        "legal_read_terms_service_understand_rights_responsibilities",
        "Read our terms of service to understand your rights and responsibilities when using the product.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("legal_terms_service", "Terms of Service"),
      description: t(
        "legal_read_terms_service_understand_rights_responsibilities",
        "Read our terms of service to understand your rights and responsibilities when using the product.",
      ),
    },
  };
}
export function generateMetadata() {
  return buildTermsMetadata(SOURCE_LOCALE);
}
export default function TermsPage({
  locale = SOURCE_LOCALE,
}: {
  locale?: SupportedLocale;
} = {}) {
  const { t } = getStaticTranslations(locale);
  const termsSections = [
    {
      id: "acceptance",
      title: <>{t("legal_acceptance_terms", "Acceptance of Terms")}</>,
      items: [
        <>
          {t(
            "legal_accessing_using_you_agree_bound_these",
            "By accessing or using {COMPANY_NAME}, you agree to be bound by these Terms of Service",
            {
              COMPANY_NAME,
            },
          )}
        </>,
        <>
          {t(
            "legal_if_you_disagree_any_part_these",
            "If you disagree with any part of these terms, you may not access the service",
          )}
        </>,
        <>
          {t(
            "legal_these_terms_apply_all_visitors_users",
            "These terms apply to all visitors, users, and others who access the service",
          )}
        </>,
        <>
          {t(
            "legal_we_may_update_these_terms_time",
            "We may update these terms from time to time without prior notice",
          )}
        </>,
      ],
    },
    {
      id: "user-accounts",
      title: <>{t("legal_user_accounts", "User Accounts")}</>,
      items: [
        <>
          {t(
            "legal_you_must_provide_accurate_complete_information",
            "You must provide accurate and complete information when creating an account",
          )}
        </>,
        <>
          {t(
            "legal_you_responsible_maintaining_security_account",
            "You are responsible for maintaining the security of your account",
          )}
        </>,
        <>
          {t(
            "legal_you_must_notify_us_immediately_any",
            "You must notify us immediately of any unauthorized use of your account",
          )}
        </>,
        <>
          {t(
            "legal_one_person_legal_entity_may_not",
            "One person or legal entity may not maintain more than one free account",
          )}
        </>,
        <>
          {t(
            "legal_accounts_registered_bots_automated_methods_not",
            "Accounts registered by bots or automated methods are not permitted",
          )}
        </>,
      ],
    },
    {
      id: "acceptable-use",
      title: <>{t("legal_acceptable_use", "Acceptable Use")}</>,
      items: [
        <>
          {t(
            "legal_use_service_only_lawful_purposes_in",
            "Use the service only for lawful purposes and in accordance with these terms",
          )}
        </>,
        <>
          {t(
            "legal_do_not_use_service_transmit_harmful",
            "Do not use the service to transmit harmful, offensive, or illegal content",
          )}
        </>,
        <>
          {t(
            "legal_do_not_attempt_gain_unauthorized_access",
            "Do not attempt to gain unauthorized access to our systems or networks",
          )}
        </>,
        <>
          {t(
            "legal_do_not_interfere_disrupt_service_servers",
            "Do not interfere with or disrupt the service or servers",
          )}
        </>,
        <>
          {t(
            "legal_do_not_use_service_compete_replicate",
            "Do not use the service to compete with or replicate our business model",
          )}
        </>,
      ],
    },
    {
      id: "payment-terms",
      title: <>{t("legal_payment_billing", "Payment and Billing")}</>,
      items: [
        <>
          {t(
            "legal_paid_plans_billed_in_advance_monthly",
            "Paid plans are billed in advance on a monthly or annual basis",
          )}
        </>,
        <>
          {t(
            "legal_all_fees_non_refundable_except_as",
            "All fees are non-refundable except as required by law",
          )}
        </>,
        <>
          {t(
            "legal_you_authorize_us_charge_payment_method",
            "You authorize us to charge your payment method for all fees",
          )}
        </>,
        <>
          {t(
            "legal_price_changes_will_communicated_30_days",
            "Price changes will be communicated with 30 days notice",
          )}
        </>,
        <>
          {t(
            "legal_failure_pay_may_result_in_service",
            "Failure to pay may result in service suspension or termination",
          )}
        </>,
      ],
    },
    {
      id: "intellectual-property",
      title: <>{t("legal_intellectual_property", "Intellectual Property")}</>,
      items: [
        <>
          {t(
            "legal_service_its_content_protected_copyright_other",
            "The service and its content are protected by copyright and other laws",
          )}
        </>,
        <>
          {t(
            "legal_you_retain_ownership_content_create_using",
            "You retain ownership of content you create using our service",
          )}
        </>,
        <>
          {t(
            "legal_you_grant_us_license_use_content",
            "You grant us a license to use your content to provide the service",
          )}
        </>,
        <>
          {t(
            "legal_you_may_not_copy_modify_distribute",
            "You may not copy, modify, or distribute our proprietary content",
          )}
        </>,
        <>
          {t(
            "legal_respect_intellectual_property_rights_others",
            "Respect the intellectual property rights of others",
          )}
        </>,
      ],
    },
    {
      id: "service-availability",
      title: <>{t("legal_service_availability", "Service Availability")}</>,
      items: [
        <>
          {t(
            "legal_we_strive_maintain_high_service_availability",
            "We strive to maintain high service availability but cannot guarantee 100% uptime",
          )}
        </>,
        <>
          {t(
            "legal_scheduled_maintenance_will_announced_in_advance",
            "Scheduled maintenance will be announced in advance when possible",
          )}
        </>,
        <>
          {t(
            "legal_we_may_modify_discontinue_features_reasonable",
            "We may modify or discontinue features with reasonable notice",
          )}
        </>,
        <>
          {t(
            "legal_emergency_maintenance_may_occur_without_prior",
            "Emergency maintenance may occur without prior notice",
          )}
        </>,
        <>
          {t(
            "legal_service_level_agreements_specified_in_subscription",
            "Service level agreements are specified in your subscription plan",
          )}
        </>,
      ],
    },
    {
      id: "termination",
      title: <>{t("legal_termination", "Termination")}</>,
      items: [
        <>
          {t(
            "legal_you_may_terminate_account_at_any",
            "You may terminate your account at any time through your account settings",
          )}
        </>,
        <>
          {t(
            "legal_we_may_terminate_accounts_violate_these",
            "We may terminate accounts that violate these terms",
          )}
        </>,
        <>
          {t(
            "legal_upon_termination_right_use_service_ceases",
            "Upon termination, your right to use the service ceases immediately",
          )}
        </>,
        <>
          {t(
            "legal_we_will_provide_reasonable_notice_before",
            "We will provide reasonable notice before terminating paid accounts",
          )}
        </>,
        <>
          {t(
            "legal_data_export_options_available_before_account",
            "Data export options are available before account termination",
          )}
        </>,
      ],
    },
    {
      id: "disclaimers",
      title: (
        <>{t("legal_disclaimers_limitations", "Disclaimers and Limitations")}</>
      ),
      items: [
        <>
          {t(
            "legal_service_provided_as_without_warranties_any",
            "The service is provided 'as is' without warranties of any kind",
          )}
        </>,
        <>
          {t(
            "legal_we_disclaim_all_warranties_express_implied",
            "We disclaim all warranties, express or implied, including merchantability",
          )}
        </>,
        <>
          {t(
            "legal_we_not_liable_indirect_incidental_consequential",
            "We are not liable for indirect, incidental, or consequential damages",
          )}
        </>,
        <>
          {t(
            "legal_total_liability_limited_amount_you_paid",
            "Our total liability is limited to the amount you paid in the last 12 months",
          )}
        </>,
        <>
          {t(
            "legal_some_jurisdictions_do_not_allow_these",
            "Some jurisdictions do not allow these limitations",
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
              <FileText className="text-muted-foreground mr-2 h-3 w-3" />
              <span className="text-muted-foreground font-mono">
                {t("legal_terms_md", "TERMS.md")}
              </span>
            </Badge>
          }
        >
          <PageIntroHeading>
            {t("legal_terms_service", "Terms of Service")}
          </PageIntroHeading>
          <PageIntroDescription className="mb-10">
            {t(
              "legal_these_terms_govern_use_outline_rights",
              "These terms govern your use of {COMPANY_NAME} and outline the rights and responsibilities of both you and us. Please read them carefully.",
              {
                COMPANY_NAME,
              },
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
          {termsSections.map((section) => {
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
            {t(
              "legal_questions_about_these_terms",
              "Questions About These Terms?",
            )}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t(
              "legal_if_you_have_any_questions_about",
              "If you have any questions about these Terms of Service, please contact our legal team.",
            )}
          </p>
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              <strong>{t("legal_email", "Email:")}</strong> {LEGAL_EMAIL}
            </p>
            <p>
              <strong>{t("legal_support_terms", "Support:")}</strong>{" "}
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
              "legal_these_terms_interpreted_under_laws_apply",
              "These Terms are interpreted under the laws that apply to the contracting entity operating {COMPANY_NAME}, unless mandatory local law requires otherwise. If any provision is unenforceable, the remaining provisions will remain in effect.",
              {
                COMPANY_NAME,
              },
            )}
          </p>
        </div>
      </ReadingContainer>
    </div>
  );
}
