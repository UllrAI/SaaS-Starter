import { getServerTranslations } from "@/lib/i18n/translation/server";
import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Clock, HelpCircle, ExternalLink, Send, Mail } from "lucide-react";
import { LocalizedLink as Link } from "@/components/localized-link";
import { SectionContainer } from "@/components/layout/page-container";
import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import {
  PageIntro,
  PageIntroDescription,
  PageIntroHeading,
} from "@/components/layout/page-intro";
import { PageSectionHeading } from "@/components/layout/page-section-heading";
import {
  COMPANY_NAME,
  CONTACT_EMAIL,
  DOCS_URL,
  GITHUB_DISCUSSIONS_URL,
  GITHUB_RELEASES_URL,
} from "@/lib/config/constants";
import {
  createLocalizedAlternates,
  createMetadataDefaults,
} from "@/lib/metadata";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
import { ContactMethods } from "./contact-methods";
import { SITE_CONFIG } from "@/lib/config/site";
export async function buildContactMetadata(locale: SupportedLocale) {
  const { t } = await getServerTranslations({ locale });
  const metadata = createMetadataDefaults({
    alternates: createLocalizedAlternates("/contact", locale),
    locale,
  });
  return {
    ...metadata,
    title: t("contact_us", "Contact Us"),
    description: t(
      "contact_get_in_touch_team_we_here",
      "Get in touch with our team. We are here to help with any product or integration questions.",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("contact_us", "Contact Us"),
      description: t(
        "contact_get_in_touch_team_we_here",
        "Get in touch with our team. We are here to help with any product or integration questions.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("contact_us", "Contact Us"),
      description: t(
        "contact_get_in_touch_team_we_here",
        "Get in touch with our team. We are here to help with any product or integration questions.",
      ),
    },
  };
}
export function generateMetadata() {
  return buildContactMetadata(SOURCE_LOCALE);
}
export default function ContactPage({
  locale = SOURCE_LOCALE,
}: {
  locale?: SupportedLocale;
} = {}) {
  const { t } = getStaticTranslations(locale);
  return (
    <>
      <MarketingPageShell>
        <PageIntro
          className="mb-20"
          badge={
            <Badge className="border-border bg-background/50 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
              <Mail className="text-muted-foreground mr-2 h-3 w-3" />
              <span className="text-muted-foreground font-mono">
                {t("contact_md", "CONTACT.md")}
              </span>
            </Badge>
          }
        >
          <PageIntroHeading>
            {t("contact_get_in_touch", "Get in Touch")}
          </PageIntroHeading>
          <PageIntroDescription>
            {t(
              "contact_have_questions_need_support_want_collaborate",
              "Have questions? Need support? Want to collaborate? We're here to help. Choose your preferred channel below.",
            )}
          </PageIntroDescription>
        </PageIntro>

        <div className="mb-24">
          <PageSectionHeading icon={<Send className="text-primary h-6 w-6" />}>
            {t("contact_channels", "Contact Channels")}
          </PageSectionHeading>

          <ContactMethods locale={locale} />
        </div>

        <div className="mb-24">
          <PageSectionHeading icon={<Clock className="text-primary h-6 w-6" />}>
            {t("contact_support_hours", "Support Hours")}
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>
                  {t("contact_standard_support", "Standard Support")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "contact_available_all_users_customers",
                    "Available for all users and customers",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("contact_monday_friday", "Monday - Friday")}
                  </span>
                  <span className="font-mono text-sm" translate="no">
                    9:00 - 18:00
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("contact_saturday", "Saturday")}
                  </span>
                  <span className="font-mono text-sm" translate="no">
                    10:00 - 16:00
                  </span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("contact_sunday", "Sunday")}
                  </span>
                  <span className="font-mono text-sm">
                    {t("contact_closed", "Closed")}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>
                  {t("contact_premium_support", "Premium Support")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "contact_enterprise_customers_sla_guarantees",
                    "Enterprise customers with SLA guarantees",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("contact_availability", "Availability")}
                  </span>
                  <span className="font-mono text-sm" translate="no">
                    24/7/365
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("contact_response_time", "Response Time")}
                  </span>
                  <span className="font-mono text-sm">
                    {t("contact_under_1_hour", "Under 1 hour")}
                  </span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("contact_priority", "Priority")}
                  </span>
                  <span className="font-mono text-sm">
                    {t("contact_critical_priority", "Critical Priority")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-24">
          <PageSectionHeading
            icon={<HelpCircle className="text-primary h-6 w-6" />}
          >
            {t("contact_quick_answers", "Quick Answers")}
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  {t(
                    "contact_what_average_response_time",
                    "What is the average response time?",
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(
                    "contact_we_typically_respond_all_inquiries_within",
                    "We typically respond to all inquiries within 24 hours during business days. Premium customers receive responses in under 1 hour.",
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  {t(
                    "contact_do_you_offer_enterprise_support",
                    "Do you offer enterprise support?",
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(
                    "contact_yes_enterprise_support_handled_through_dedicated",
                    "Yes. Enterprise support is handled through dedicated email workflows and structured issue triage so requests stay traceable from report to resolution.",
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("contact_can_i_schedule_demo", "Can I schedule a demo?")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(
                    "contact_yes_send_use_case_include_product",
                    "Yes. Send your use case to {CONTACT_EMAIL} and include the product area you want to review so we can route it correctly.",
                    {
                      CONTACT_EMAIL,
                    },
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  {t(
                    "contact_where_can_i_find_documentation",
                    "Where can I find documentation?",
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                  {t(
                    "contact_comprehensive_documentation_covers_all_features_apis",
                    "Our comprehensive documentation covers all features, APIs, and integrations.",
                  )}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={DOCS_URL}
                    className="inline-flex items-center gap-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="text-xs">
                      {t("contact_view_docs", "View Docs")}
                    </span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <PageSectionHeading
            icon={<ExternalLink className="text-primary h-6 w-6" />}
          >
            {t("contact_helpful_resources", "Helpful Resources")}
          </PageSectionHeading>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("contact_documentation", "Documentation")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t(
                    "contact_complete_guides_api_references",
                    "Complete guides and API references",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <a href={DOCS_URL} target="_blank" rel="noreferrer">
                    {t("contact_open_docs", "Open Docs")}
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("contact_community_forum", "Community Forum")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t(
                    "contact_connect_other_developers",
                    "Connect with other developers",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={GITHUB_DISCUSSIONS_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("contact_join_discussions", "Join Discussions")}
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("contact_release_notes", "Release Notes")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t(
                    "contact_track_shipping_history_starter_changes",
                    "Track shipping history and starter changes",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={GITHUB_RELEASES_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("contact_view_releases", "View Releases")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </MarketingPageShell>

      <section className="py-24">
        <SectionContainer>
          <PageIntro>
            <PageIntroHeading as="h2" className="mb-4 text-3xl">
              {t("contact_ready_get_started", "Ready to Get Started?")}
            </PageIntroHeading>
            <PageIntroDescription className="mb-8 text-lg">
              {t(
                "contact_join_thousands_developers_building_amazing_products",
                "Join thousands of developers building amazing products with {COMPANY_NAME}.",
                {
                  COMPANY_NAME,
                },
              )}
            </PageIntroDescription>
            <div className="flex flex-wrap justify-center gap-4">
              {SITE_CONFIG.features.billing && (
                <Button asChild size="lg">
                  <Link href="/pricing" locale={locale}>
                    {t("contact_view_pricing", "View Pricing")}
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="lg" asChild>
                <Link href="/about" locale={locale}>
                  {t("contact_learn_more", "Learn More")}
                </Link>
              </Button>
            </div>
          </PageIntro>
        </SectionContainer>
      </section>
    </>
  );
}
