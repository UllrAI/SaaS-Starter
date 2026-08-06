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
    title: t("legal_terms_service"),
    description: t("legal_terms_rights_responsibilities"),
    openGraph: {
      ...metadata.openGraph,
      title: t("legal_terms_service"),
      description: t("legal_terms_rights_responsibilities"),
    },
    twitter: {
      ...metadata.twitter,
      title: t("legal_terms_service"),
      description: t("legal_terms_rights_responsibilities"),
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
      title: <>{t("legal_acceptance_terms")}</>,
      items: [
        <>
          {t.rich("legal_accessing_using_you_agree_bound_these", {
            COMPANY_NAME,
          })}
        </>,
        <>{t("legal_if_you_disagree_any_part_these")}</>,
        <>{t("legal_these_terms_apply_all_visitors_users")}</>,
        <>{t("legal_we_may_update_these_terms_time")}</>,
      ],
    },
    {
      id: "user-accounts",
      title: <>{t("legal_user_accounts")}</>,
      items: [
        <>{t("legal_accurate_account_info")}</>,
        <>{t("legal_account_security_responsibility")}</>,
        <>{t("legal_you_must_notify_us_immediately_any")}</>,
        <>{t("legal_one_person_legal_entity_may_not")}</>,
        <>{t("legal_no_bot_accounts")}</>,
      ],
    },
    {
      id: "acceptable-use",
      title: <>{t("legal_acceptable_use")}</>,
      items: [
        <>{t("legal_use_service_only_lawful_purposes_in")}</>,
        <>{t("legal_do_not_use_service_transmit_harmful")}</>,
        <>{t("legal_do_not_attempt_gain_unauthorized_access")}</>,
        <>{t("legal_no_service_interference")}</>,
        <>{t("legal_do_not_use_service_compete_replicate")}</>,
      ],
    },
    {
      id: "payment-terms",
      title: <>{t("legal_payment_billing")}</>,
      items: [
        <>{t("legal_paid_plans_billed_in_advance_monthly")}</>,
        <>{t("legal_all_fees_non_refundable_except_as")}</>,
        <>{t("legal_you_authorize_us_charge_payment_method")}</>,
        <>{t("legal_price_changes_will_communicated_30_days")}</>,
        <>{t("legal_failure_pay_may_result_in_service")}</>,
      ],
    },
    {
      id: "intellectual-property",
      title: <>{t("legal_intellectual_property")}</>,
      items: [
        <>{t("legal_copyright_protection")}</>,
        <>{t("legal_content_ownership")}</>,
        <>{t("legal_you_grant_us_license_use_content")}</>,
        <>{t("legal_you_may_not_copy_modify_distribute")}</>,
        <>{t("legal_respect_ip_rights")}</>,
      ],
    },
    {
      id: "service-availability",
      title: <>{t("legal_service_availability")}</>,
      items: [
        <>{t("legal_service_uptime_effort")}</>,
        <>{t("legal_scheduled_maintenance")}</>,
        <>{t("legal_modify_features_notice")}</>,
        <>{t("legal_emergency_maintenance")}</>,
        <>{t("legal_sla_in_subscription")}</>,
      ],
    },
    {
      id: "termination",
      title: <>{t("legal_termination")}</>,
      items: [
        <>{t("legal_you_may_terminate_account_at_any")}</>,
        <>{t("legal_we_may_terminate_accounts_violate_these")}</>,
        <>{t("legal_termination_ceases_access")}</>,
        <>{t("legal_paid_termination_notice")}</>,
        <>{t("legal_data_export_options")}</>,
      ],
    },
    {
      id: "disclaimers",
      title: <>{t("legal_disclaimers_limitations")}</>,
      items: [
        <>{t("legal_service_as_is")}</>,
        <>{t("legal_disclaim_warranties")}</>,
        <>{t("legal_no_liability_damages")}</>,
        <>{t("legal_total_liability_limited_amount_you_paid")}</>,
        <>{t("legal_some_jurisdictions_do_not_allow_these")}</>,
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
                {t("legal_terms_md")}
              </span>
            </Badge>
          }
        >
          <PageIntroHeading>{t("legal_terms_service")}</PageIntroHeading>
          <PageIntroDescription className="mb-10">
            {t.rich("legal_these_terms_govern_use_outline_rights", {
              COMPANY_NAME,
            })}
          </PageIntroDescription>
          <div className="text-muted-foreground text-sm">
            <p>{t("legal_last_updated_december_2024")}</p>
            <p>{t("legal_effective_december_1_2024")}</p>
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
            {t("legal_questions_about_these_terms")}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t("legal_if_you_have_any_questions_about")}
          </p>
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              <strong>{t("legal_email")}</strong> {LEGAL_EMAIL}
            </p>
            <p>
              <strong>{t("legal_support_terms")}</strong>{" "}
              <Link
                href="/contact"
                locale={locale}
                className="underline underline-offset-4"
              >
                {t("legal_contact_page")}
              </Link>
            </p>
            <p>
              <strong>{t("legal_community")}</strong>{" "}
              <a
                href={GITHUB_DISCUSSIONS_URL}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                {t("legal_git_hub_discussions")}
              </a>
            </p>
          </div>
        </div>

        <div className="text-muted-foreground mt-12 border-t pt-8 text-center text-sm">
          <p>
            {t.rich("legal_governing_law", {
              COMPANY_NAME,
            })}
          </p>
        </div>
      </ReadingContainer>
    </div>
  );
}
