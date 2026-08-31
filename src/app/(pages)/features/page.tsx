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
    title: t("features_title"),
    description: t("features_modules_included"),
    openGraph: {
      ...metadata.openGraph,
      title: t("features_title"),
      description: t("features_modules_included"),
    },
    twitter: {
      ...metadata.twitter,
      title: t("features_title"),
      description: t("features_modules_included"),
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
    <>{t("features_next_js_app_router_structure_page")}</>,
    <>{t("features_auth_login_signup")}</>,
    <>{t("features_api_keys_cli_device_login_versioned")}</>,
    <>{t("features_stripe_billing")}</>,
    <>{t("features_admin_pages")}</>,
    <>{t("features_r2_upload_flows")}</>,
    <>{t("features_blog_markdown")}</>,
    <>{t("features_playwright_smoke_tests")}</>,
  ];
  const customizationItems = [
    <>{t("features_own_product_logic")}</>,
    <>{t("features_production_infra")}</>,
    <>{t("features_brand_assets")}</>,
    <>{t("features_provider_credentials")}</>,
  ];
  return (
    <>
      <MarketingPageShell>
        <PageIntro
          className="mb-20"
          badge={
            <Badge className="border-border bg-background inline-flex items-center border px-3 py-1 text-sm">
              <Package2 className="text-muted-foreground mr-2 h-3 w-3" />
              <span className="text-muted-foreground font-mono">
                {t("features_starter_scope")}
              </span>
            </Badge>
          }
        >
          <PageIntroHeading>
            {t("features_shipped_ready_scale")}
          </PageIntroHeading>
          <PageIntroDescription>
            {t("features_every_feature_listed_here_exists_in")}
          </PageIntroDescription>
        </PageIntro>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="text-primary h-5 w-5" />
                {t("features_included_today")}
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
                {t("features_you_still_configure")}
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
