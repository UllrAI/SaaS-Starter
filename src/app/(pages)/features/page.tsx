import { getServerTranslations } from "@/lib/i18n/translation/server";
import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Features } from "@/components/homepage/features";
import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import {
  PageIntro,
  PageIntroDescription,
  PageIntroHeading,
} from "@/components/layout/page-intro";
import { CheckCircle2, Package2, Wrench } from "lucide-react";
import {
  createLocalizedAlternates,
  createMetadataDefaults,
} from "@/lib/metadata";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
export async function buildFeaturesMetadata(locale: SupportedLocale) {
  const { t } = await getServerTranslations({ locale });
  const metadata = createMetadataDefaults({
    alternates: createLocalizedAlternates("/features", locale),
    locale,
  });
  return {
    ...metadata,
    title: t("features_title", "Features"),
    description: t(
      "features_review_actual_modules_included_in_saa",
      "Review the actual modules included in the SaaS Starter: auth, agent-ready APIs, CLI device auth, billing, admin tooling, uploads, localization, content infrastructure, and E2E smoke coverage.",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("features_title", "Features"),
      description: t(
        "features_review_actual_modules_included_in_saa",
        "Review the actual modules included in the SaaS Starter: auth, agent-ready APIs, CLI device auth, billing, admin tooling, uploads, localization, content infrastructure, and E2E smoke coverage.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("features_title", "Features"),
      description: t(
        "features_review_actual_modules_included_in_saa",
        "Review the actual modules included in the SaaS Starter: auth, agent-ready APIs, CLI device auth, billing, admin tooling, uploads, localization, content infrastructure, and E2E smoke coverage.",
      ),
    },
  };
}
export function generateMetadata() {
  return buildFeaturesMetadata(SOURCE_LOCALE);
}
export default function FeaturesPage({
  locale = SOURCE_LOCALE,
}: {
  locale?: SupportedLocale;
} = {}) {
  const { t } = getStaticTranslations(locale);
  const includedItems = [
    <>
      {t(
        "features_next_js_app_router_structure_page",
        "Next.js App Router structure with page/layout conventions",
      )}
    </>,
    <>
      {t(
        "features_better_auth_login_signup_session_permission",
        "Better Auth login, signup, session, and permission guards",
      )}
    </>,
    <>
      {t(
        "features_api_keys_cli_device_login_versioned",
        "API keys, CLI device login, and versioned `/api/v1/*` machine auth routes",
      )}
    </>,
    <>
      {t(
        "features_creem_checkout_portal_subscription_records_webhooks",
        "Creem checkout, portal, subscription records, and webhooks",
      )}
    </>,
    <>
      {t(
        "features_admin_pages_users_payments_subscriptions_uploads",
        "Admin pages for users, payments, subscriptions, and uploads",
      )}
    </>,
    <>
      {t(
        "features_cloudflare_r2_upload_flows_browser_server",
        "Cloudflare R2 upload flows for browser and server uploads",
      )}
    </>,
    <>
      {t(
        "features_markdown_blog_content_typed_collections_marketing",
        "Markdown blog content, typed collections, and marketing pages",
      )}
    </>,
    <>
      {t(
        "features_playwright_smoke_coverage_auth_api_key",
        "Playwright smoke coverage for auth, API key flows, CLI auth, admin, and locale routing",
      )}
    </>,
  ];
  const customizationItems = [
    <>
      {t(
        "features_own_product_logic_domain_specific_data",
        "Your own product logic, domain-specific data model, and integrations",
      )}
    </>,
    <>
      {t(
        "features_production_infrastructure_deployment_secrets_observability",
        "Production infrastructure, deployment, secrets, and observability",
      )}
    </>,
    <>
      {t(
        "features_brand_assets_copy_plan_definitions_match",
        "Brand assets, copy, and plan definitions that match your business",
      )}
    </>,
    <>
      {t(
        "features_provider_credentials_auth_billing_email_storage",
        "Provider credentials for auth, billing, email, storage, and analytics",
      )}
    </>,
  ];
  return (
    <>
      <MarketingPageShell>
        <PageIntro
          className="mb-20"
          badge={
            <Badge className="border-border bg-background/50 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
              <Package2 className="text-muted-foreground mr-2 h-3 w-3" />
              <span className="text-muted-foreground font-mono">
                {t("features_starter_scope", "STARTER_SCOPE")}
              </span>
            </Badge>
          }
        >
          <PageIntroHeading>
            {t("features_shipped_ready_scale", "Shipped and ready to scale")}
          </PageIntroHeading>
          <PageIntroDescription>
            {t(
              "features_every_feature_listed_here_exists_in",
              "Every feature listed here exists in the codebase today. No roadmaps or placeholders. Just tested foundations for human users, APIs, and agent workflows you can reuse immediately.",
            )}
          </PageIntroDescription>
        </PageIntro>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="text-primary h-5 w-5" />
                {t("features_included_today", "Included today")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              {includedItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="text-primary h-5 w-5" />
                {t("features_you_still_configure", "You still configure")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              {customizationItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Wrench className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </MarketingPageShell>

      <Features locale={locale} />
    </>
  );
}
