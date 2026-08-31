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
    title: t("contact_us"),
    description: t("contact_get_in_touch_team_we_here"),
    openGraph: {
      ...metadata.openGraph,
      title: t("contact_us"),
      description: t("contact_get_in_touch_team_we_here"),
    },
    twitter: {
      ...metadata.twitter,
      title: t("contact_us"),
      description: t("contact_get_in_touch_team_we_here"),
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
            <Badge className="border-border bg-background inline-flex items-center border px-3 py-1 text-sm">
              <Mail className="text-muted-foreground mr-2 h-3 w-3" />
              <span className="text-muted-foreground font-mono">
                {t("contact_md")}
              </span>
            </Badge>
          }
        >
          <PageIntroHeading>{t("contact_get_in_touch")}</PageIntroHeading>
          <PageIntroDescription>
            {t("contact_questions_support")}
          </PageIntroDescription>
        </PageIntro>

        <div className="mb-24">
          <PageSectionHeading icon={<Send className="text-primary h-6 w-6" />}>
            {t("contact_channels")}
          </PageSectionHeading>

          <ContactMethods locale={locale} />
        </div>

        <div className="mb-24">
          <PageSectionHeading icon={<Clock className="text-primary h-6 w-6" />}>
            {t("contact_support_hours")}
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("contact_standard_support")}</CardTitle>
                <CardDescription>
                  {t("contact_available_all_users_customers")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("contact_monday_friday")}
                  </span>
                  <span className="font-mono text-sm" translate="no">
                    9:00 - 18:00
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("contact_saturday")}
                  </span>
                  <span className="font-mono text-sm" translate="no">
                    10:00 - 16:00
                  </span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("contact_sunday")}
                  </span>
                  <span className="font-mono text-sm">
                    {t("contact_closed")}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("contact_premium_support")}</CardTitle>
                <CardDescription>
                  {t("contact_enterprise_customers_sla_guarantees")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("contact_availability")}
                  </span>
                  <span className="font-mono text-sm" translate="no">
                    24/7/365
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("contact_response_time")}
                  </span>
                  <span className="font-mono text-sm">
                    {t("contact_under_1_hour")}
                  </span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("contact_priority")}
                  </span>
                  <span className="font-mono text-sm">
                    {t("contact_critical_priority")}
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
            {t("contact_quick_answers")}
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("contact_what_average_response_time")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("contact_response_time_sla")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("contact_do_you_offer_enterprise_support")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("contact_enterprise_support_workflow")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("contact_can_i_schedule_demo")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("contact_yes_send_use_case_include_product", {
                    CONTACT_EMAIL,
                  })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("contact_where_can_i_find_documentation")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                  {t("contact_documentation_covers")}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={DOCS_URL}
                    className="inline-flex items-center gap-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="text-xs">{t("contact_view_docs")}</span>
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
            {t("contact_helpful_resources")}
          </PageSectionHeading>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("contact_documentation")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("contact_complete_guides_api_references")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <a href={DOCS_URL} target="_blank" rel="noreferrer">
                    {t("contact_open_docs")}
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("contact_community_forum")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("contact_connect_other_developers")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={GITHUB_DISCUSSIONS_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("contact_join_discussions")}
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("contact_release_notes")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("contact_shipping_history")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={GITHUB_RELEASES_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("contact_view_releases")}
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
              {t("contact_ready_get_started")}
            </PageIntroHeading>
            <PageIntroDescription className="mb-8 text-lg">
              {t("contact_join_developers", {
                COMPANY_NAME,
              })}
            </PageIntroDescription>
            <div className="flex flex-wrap gap-4">
              {SITE_CONFIG.features.billing && (
                <Button asChild size="lg">
                  <Link href="/pricing" locale={locale}>
                    {t("contact_view_pricing")}
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="lg" asChild>
                <Link href="/about" locale={locale}>
                  {t("contact_learn_more")}
                </Link>
              </Button>
            </div>
          </PageIntro>
        </SectionContainer>
      </section>
    </>
  );
}
