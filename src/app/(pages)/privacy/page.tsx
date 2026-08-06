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
    title: t("legal_privacy_policy"),
    description: t("legal_learn_how_we_collect_use_protect"),
    openGraph: {
      ...metadata.openGraph,
      title: t("legal_privacy_policy"),
      description: t("legal_learn_how_we_collect_use_protect"),
    },
    twitter: {
      ...metadata.twitter,
      title: t("legal_privacy_policy"),
      description: t("legal_learn_how_we_collect_use_protect"),
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
      title: <>{t("legal_information_we_collect")}</>,
      items: [
        <>{t("legal_account_information_name_email_password")}</>,
        <>{t("legal_usage_data_analytics")}</>,
        <>{t("legal_device_browser_information")}</>,
        <>{t("legal_payment_info_processing")}</>,
        <>{t("legal_communications_support_team")}</>,
      ],
    },
    {
      id: "information-use",
      title: <>{t("legal_how_we_use_information")}</>,
      items: [
        <>{t("legal_provide_maintain_services")}</>,
        <>{t("legal_process_transactions")}</>,
        <>{t("legal_send_technical_notices_support_messages")}</>,
        <>{t("legal_improve_services_develop_new_features")}</>,
        <>{t("legal_comply_legal_obligations")}</>,
      ],
    },
    {
      id: "information-sharing",
      title: <>{t("legal_information_sharing")}</>,
      items: [
        <>{t("legal_we_do_not_sell_personal_information")}</>,
        <>{t("legal_service_providers")}</>,
        <>{t("legal_compliance_when_required_law")}</>,
        <>{t("legal_business_transfers_mergers_acquisitions")}</>,
        <>{t("legal_explicit_consent")}</>,
      ],
    },
    {
      id: "data-security",
      title: <>{t("legal_data_security")}</>,
      items: [
        <>{t("legal_encryption_in_transit")}</>,
        <>{t("legal_regular_security_audits_assessments")}</>,
        <>{t("legal_access_controls_authentication_measures")}</>,
        <>{t("legal_secure_data_centers_physical_security")}</>,
        <>{t("legal_employee_training_data_protection")}</>,
      ],
    },
    {
      id: "your-rights",
      title: <>{t("legal_rights")}</>,
      items: [
        <>{t("legal_access_personal_information")}</>,
        <>{t("legal_correct_inaccurate_information")}</>,
        <>{t("legal_delete_account_data")}</>,
        <>{t("legal_export_data")}</>,
        <>{t("legal_opt_out_marketing_communications")}</>,
      ],
    },
    {
      id: "data-retention",
      title: <>{t("legal_data_retention")}</>,
      items: [
        <>{t("legal_account_data_retained_while_active")}</>,
        <>{t("legal_usage_data_retained_up_2_years")}</>,
        <>{t("legal_support_communications_retained_3_years")}</>,
        <>{t("legal_compliance_as_required_applicable_laws")}</>,
        <>{t("legal_deleted_data_retention")}</>,
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
                {t("legal_privacy_md")}
              </span>
            </Badge>
          }
        >
          <PageIntroHeading>{t("legal_privacy_policy")}</PageIntroHeading>
          <PageIntroDescription className="mb-10">
            {t("legal_privacy_security_commitment")}
          </PageIntroDescription>
          <div className="text-muted-foreground text-sm">
            <p>{t("legal_last_updated_december_2024")}</p>
            <p>{t("legal_effective_december_1_2024")}</p>
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
            {t("legal_questions_about_policy")}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t("legal_if_you_have_any_questions_about_privacy")}
          </p>
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              <strong>{t("legal_email")}</strong> {PRIVACY_EMAIL}
            </p>
            <p>
              <strong>{t("legal_support")}</strong>{" "}
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
          <p>{t("legal_privacy_governing_law")}</p>
        </div>
      </ReadingContainer>
    </div>
  );
}
