import { getServerTranslations } from "@/lib/i18n/translation/server";
import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Terminal, Zap, Shield, Users, Info } from "lucide-react";
import { LocalizedLink as Link } from "@/components/localized-link";
import { SectionContainer } from "@/components/layout/page-container";
import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import {
  PageIntro,
  PageIntroDescription,
  PageIntroHeading,
} from "@/components/layout/page-intro";
import { PageSectionHeading } from "@/components/layout/page-section-heading";
import { createLocalizedAlternates } from "@/lib/metadata";
import { SOURCE_LOCALE } from "@/lib/config/i18n";
import { APP_NAME, OGIMAGE, TWITTERACCOUNT } from "@/lib/config/constants";
import env from "@/env";
import type { Metadata } from "next";
import type { SupportedLocale } from "@/lib/config/i18n";
import { SUPPORTED_LOCALES } from "@/lib/config/i18n";
import { getOpenGraphLocale } from "@/lib/metadata";
import { SITE_CONFIG } from "@/lib/config/site";

export async function buildAboutMetadata(
  locale: SupportedLocale,
): Promise<Metadata> {
  const { t } = await getServerTranslations({ locale });
  const alternates = createLocalizedAlternates("/about", locale);
  const canonical = alternates.canonical;
  const canonicalUrl =
    typeof canonical === "string" || canonical instanceof URL
      ? canonical
      : undefined;
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
    alternates,
    title: t("about_us"),
    description: t("about_mission"),
    openGraph: {
      title: t("about_us"),
      description: t("about_mission"),
      url: canonicalUrl,
      images: [{ url: OGIMAGE, width: 1480, height: 777, alt: APP_NAME }],
      locale: getOpenGraphLocale(locale),
      alternateLocale: SUPPORTED_LOCALES.filter(
        (supportedLocale) => supportedLocale !== locale,
      ).map(getOpenGraphLocale),
      siteName: APP_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      creator: TWITTERACCOUNT,
      title: t("about_us"),
      description: t("about_mission"),
      images: [{ url: OGIMAGE, width: 1480, height: 777, alt: APP_NAME }],
    },
  };
}

export function generateMetadata(): Promise<Metadata> {
  return buildAboutMetadata(SOURCE_LOCALE);
}

export default function AboutPage({
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
              <Info className="text-muted-foreground mr-2 h-3 w-3" />
              <span className="text-muted-foreground font-mono">
                {t("about_readme_md")}
              </span>
            </Badge>
          }
        >
          <PageIntroHeading>{t("about_building_future_saas")}</PageIntroHeading>
          <PageIntroDescription>
            {t("about_starter_focuses_real_saas_foundations")}
          </PageIntroDescription>
        </PageIntro>

        <div className="mb-24">
          <PageSectionHeading
            icon={<Terminal className="text-primary h-6 w-6" />}
          >
            {t("about_core_principles")}
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="text-primary mb-4 flex h-12 w-12 items-center">
                  <Zap className="h-6 w-6" />
                </div>
                <CardTitle>{t("about_practical_workflow_speed")}</CardTitle>
                <CardDescription>
                  {t("about_project_shaped_builders_who_need_move")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-primary mb-4 flex h-12 w-12 items-center">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle>{t("about_security_boundaries")}</CardTitle>
                <CardDescription>
                  {t("about_services_behind_config")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-primary mb-4 flex h-12 w-12 items-center">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle>{t("about_maintainable_defaults")}</CardTitle>
                <CardDescription>{t("about_code_conventions")}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        <div className="mb-24">
          <PageSectionHeading icon={<Users className="text-primary h-6 w-6" />}>
            {t("about_what_you_can_verify")}
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>{t("about_real_checkout_flow")}</CardTitle>
                <CardDescription>
                  {t("about_billing_abstraction")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("about_protected_app_routes")}</CardTitle>
                <CardDescription>
                  {t("about_dashboard_settings_admin_areas_use_same")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("about_repository_content")}</CardTitle>
                <CardDescription>
                  {t("about_marketing_pages_blog_content_legal_live")}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        <div>
          <PageSectionHeading
            icon={<Shield className="text-primary h-6 w-6" />}
          >
            {t("about_maintenance_model")}
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("about_code_over_claims")}</CardTitle>
                <CardDescription>
                  {t("about_capabilities_in_code")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("about_small_reviewable_changes")}</CardTitle>
                <CardDescription>
                  {t("about_scoped_improvements")}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </MarketingPageShell>

      <section className="py-24">
        <SectionContainer>
          <PageIntro>
            <PageIntroHeading as="h2" className="mb-4 text-3xl">
              {t("about_ready_build_something_amazing")}
            </PageIntroHeading>
            <PageIntroDescription className="mb-8 text-lg">
              {t("about_build_saas_product_works_well")}
            </PageIntroDescription>
            <div className="flex flex-wrap gap-4">
              {SITE_CONFIG.features.billing && (
                <Button asChild size="lg">
                  <Link href="/pricing" locale={locale}>
                    {t("about_get_started_today")}
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact" locale={locale}>
                  {t("about_contact_sales")}
                </Link>
              </Button>
            </div>
          </PageIntro>
        </SectionContainer>
      </section>
    </>
  );
}
