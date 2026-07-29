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
    title: t("about_us", "About Us"),
    description: t(
      "about_learn_about_mission_help_developers_build",
      "Learn about our mission to help developers build and launch SaaS products faster with real, tested, and agent-friendly foundations.",
    ),
    openGraph: {
      title: t("about_us", "About Us"),
      description: t(
        "about_learn_about_mission_help_developers_build",
        "Learn about our mission to help developers build and launch SaaS products faster with real, tested, and agent-friendly foundations.",
      ),
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
      title: t("about_us", "About Us"),
      description: t(
        "about_learn_about_mission_help_developers_build",
        "Learn about our mission to help developers build and launch SaaS products faster with real, tested, and agent-friendly foundations.",
      ),
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
            <Badge className="border-border bg-background/50 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
              <Info className="text-muted-foreground mr-2 h-3 w-3" />
              <span className="text-muted-foreground font-mono">
                {t("about_readme_md", "README.md")}
              </span>
            </Badge>
          }
        >
          <PageIntroHeading>
            {t("about_building_future_saas", "Building the future of SaaS")}
          </PageIntroHeading>
          <PageIntroDescription>
            {t(
              "about_starter_focuses_real_saas_foundations",
              "This starter focuses on real SaaS foundations: authentication, billing, database access, uploads, localization, and operational screens that can be inspected, tested, and extended without replacing placeholder flows first.",
            )}
          </PageIntroDescription>
        </PageIntro>

        <div className="mb-24">
          <PageSectionHeading
            icon={<Terminal className="text-primary h-6 w-6" />}
          >
            {t("about_core_principles", "Core Principles")}
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="bg-primary/10 text-primary border-primary/20 mb-4 flex h-12 w-12 items-center justify-center border">
                  <Zap className="h-6 w-6" />
                </div>
                <CardTitle>
                  {t(
                    "about_practical_workflow_speed",
                    "Practical Workflow Speed",
                  )}
                </CardTitle>
                <CardDescription>
                  {t(
                    "about_project_shaped_builders_who_need_move",
                    "The project is shaped for builders who need to move quickly without losing the ability to understand, test, and modify the code they ship.",
                  )}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <div className="bg-primary/10 text-primary border-primary/20 mb-4 flex h-12 w-12 items-center justify-center border">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle>
                  {t("about_security_boundaries", "Security Boundaries")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "about_auth_billing_uploads_environment_configuration_kept",
                    "Auth, billing, uploads, and environment configuration are kept behind explicit server-side checks instead of optimistic UI assumptions.",
                  )}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <div className="bg-primary/10 text-primary border-primary/20 mb-4 flex h-12 w-12 items-center justify-center border">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle>
                  {t("about_maintainable_defaults", "Maintainable Defaults")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "about_code_favors_ordinary_next_js_conventions",
                    "The code favors ordinary Next.js conventions, small modules, and reusable components over framework tricks or hidden generators.",
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        <div className="mb-24">
          <PageSectionHeading icon={<Users className="text-primary h-6 w-6" />}>
            {t("about_what_you_can_verify", "What You Can Verify")}
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>
                  {t("about_real_checkout_flow", "Real Checkout Flow")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "about_pricing_actions_call_billing_provider_abstraction",
                    "Pricing actions call the billing provider abstraction and return users through a verifiable payment status page.",
                  )}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>
                  {t("about_protected_app_routes", "Protected App Routes")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "about_dashboard_settings_admin_areas_use_same",
                    "Dashboard, settings, and admin areas use the same route protection and session boundaries as production features.",
                  )}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>
                  {t("about_repository_content", "Repository Content")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "about_marketing_pages_blog_content_legal_live",
                    "Marketing pages, blog content, and legal pages live in the repository so changes can be reviewed with the code.",
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        <div>
          <PageSectionHeading
            icon={<Shield className="text-primary h-6 w-6" />}
          >
            {t("about_maintenance_model", "Maintenance Model")}
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>
                  {t("about_code_over_claims", "Code Over Claims")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "about_project_capabilities_represented_implemented_routes_configuration",
                    "Project capabilities are represented by implemented routes, configuration, tests, and documentation instead of invented release milestones.",
                  )}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>
                  {t(
                    "about_small_reviewable_changes",
                    "Small, Reviewable Changes",
                  )}
                </CardTitle>
                <CardDescription>
                  {t(
                    "about_improvements_should_stay_scoped_keep_migrations",
                    "Improvements should stay scoped, keep migrations and generated assets aligned, and include the checks needed for confidence.",
                  )}
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
              {t(
                "about_ready_build_something_amazing",
                "Ready to Build Something Amazing?",
              )}
            </PageIntroHeading>
            <PageIntroDescription className="mb-8 text-lg">
              {t(
                "about_build_saas_product_works_well",
                "Build a SaaS product that works well for end users, internal tooling, and agent-friendly automation from day one.",
              )}
            </PageIntroDescription>
            <div className="flex flex-wrap justify-center gap-4">
              {SITE_CONFIG.features.billing && (
                <Button asChild size="lg">
                  <Link href="/pricing" locale={locale}>
                    {t("about_get_started_today", "Get Started Today")}
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact" locale={locale}>
                  {t("about_contact_sales", "Contact Sales")}
                </Link>
              </Button>
            </div>
          </PageIntro>
        </SectionContainer>
      </section>
    </>
  );
}
