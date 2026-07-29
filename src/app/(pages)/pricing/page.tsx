import { getServerTranslations } from "@/lib/i18n/translation/server";
import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { LocalizedLink as Link } from "@/components/localized-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import {
  PageIntro,
  PageIntroDescription,
  PageIntroHeading,
} from "@/components/layout/page-intro";
import { PageSectionHeading } from "@/components/layout/page-section-heading";
import { PricingSection } from "@/components/payment-options";
import { PAYMENT_PROVIDER } from "@/lib/config/constants";
import {
  createLocalizedAlternates,
  createMetadataDefaults,
} from "@/lib/metadata";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
import {
  Boxes,
  CreditCard,
  Database,
  Info,
  LockKeyhole,
  Upload,
} from "lucide-react";
import { SITE_CONFIG } from "@/lib/config/site";
import { notFound } from "next/navigation";
export async function buildPricingMetadata(locale: SupportedLocale) {
  const { t } = await getServerTranslations({ locale });
  const metadata = createMetadataDefaults({
    alternates: createLocalizedAlternates("/pricing", locale),
    locale,
  });
  return {
    ...metadata,
    title: t("pricing_title", "Pricing"),
    description: t(
      "pricing_saas_starter_codebase_review",
      "Pricing for the SaaS Starter codebase. Review the current package structure, verification stack, and what is included before checkout.",
    ),
    keywords: [
      "pricing",
      "starter kit",
      "next.js starter",
      "saas starter",
      "billing",
    ],
    openGraph: {
      ...metadata.openGraph,
      title: t("pricing_title", "Pricing"),
      description: t(
        "pricing_saas_starter_codebase_review",
        "Pricing for the SaaS Starter codebase. Review the current package structure, verification stack, and what is included before checkout.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("pricing_title", "Pricing"),
      description: t(
        "pricing_saas_starter_codebase_review",
        "Pricing for the SaaS Starter codebase. Review the current package structure, verification stack, and what is included before checkout.",
      ),
    },
  };
}
export function generateMetadata() {
  return buildPricingMetadata(SOURCE_LOCALE);
}
export default function PricingPage({
  locale = SOURCE_LOCALE,
}: {
  locale?: SupportedLocale;
} = {}) {
  if (!SITE_CONFIG.features.billing) {
    notFound();
  }

  const { t } = getStaticTranslations(locale);
  const includedCards = [
    {
      id: "auth",
      icon: LockKeyhole,
      title: <>{t("pricing_auth_permissions", "Auth and permissions")}</>,
      description: (
        <>
          {t(
            "pricing_login_signup_session_handling_protected_routes",
            "Login, signup, session handling, protected routes, and admin gating are already implemented.",
          )}
        </>
      ),
    },
    {
      id: "billing",
      icon: CreditCard,
      title: <>{t("pricing_billing_workflow", "Billing workflow")}</>,
      description: (
        <>
          {t(
            "pricing_checkout_portal_access_webhooks_subscription_records",
            "Checkout, portal access, webhooks, subscription records, and billing screens are part of the starter.",
          )}
        </>
      ),
    },
    {
      id: "data",
      icon: Database,
      title: <>{t("pricing_data_admin", "Data and admin")}</>,
      description: (
        <>
          {t(
            "pricing_drizzle_backed_data_access_admin_pages",
            "Drizzle-backed data access and admin pages for users, payments, subscriptions, and uploads ship together.",
          )}
        </>
      ),
    },
    {
      id: "uploads",
      icon: Upload,
      title: <>{t("pricing_uploads_storage", "Uploads and storage")}</>,
      description: (
        <>
          {t(
            "pricing_browser_uploads_server_cloudflare_r2_integration",
            "Browser uploads, server uploads, and Cloudflare R2 integration are included for file-heavy products.",
          )}
        </>
      ),
    },
  ];
  const notes = [
    <>
      {t(
        "pricing_project_self_hosted_starter_hosting_secrets",
        "This project is a self-hosted starter. Hosting, secrets, observability, and production operations stay with you.",
      )}
    </>,
    <>
      {t(
        "pricing_payment_flow_in_repo_currently_wired",
        "The payment flow in this repo is currently wired to Creem. Replace or extend it if your business uses another provider.",
      )}
    </>,
    <>
      {t(
        "pricing_plan_definitions_feature_entitlements_lifecycle_messaging",
        "Plan definitions, feature entitlements, and lifecycle messaging should be updated to reflect your real commercial offer before launch.",
      )}
    </>,
    <>
      {t(
        "pricing_current_verification_stack_includes_jest_coverage",
        "The current verification stack includes Jest coverage plus Playwright smoke tests for auth, admin, and locale routing. Extend browser coverage before relying on custom billing or upload flows in production.",
      )}
    </>,
  ];
  return (
    <MarketingPageShell>
      <PageIntro
        className="mb-20"
        badge={
          <Badge className="border-border bg-background/50 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
            <Boxes className="text-muted-foreground mr-2 h-3 w-3" />
            <span className="text-muted-foreground font-mono">
              {t("pricing_starter_pricing", "STARTER_PRICING")}
            </span>
          </Badge>
        }
      >
        <PageIntroHeading>
          {t(
            "pricing_simple_transparent_pricing",
            "Simple, transparent pricing",
          )}
        </PageIntroHeading>
        <PageIntroDescription className="mx-auto max-w-3xl">
          {t(
            "pricing_choose_plan_fits_you_no_hidden",
            "Choose the plan that fits you. No hidden fees, no surprises.",
          )}
        </PageIntroDescription>
      </PageIntro>

      <div className="mb-24">
        <PricingSection />
      </div>

      <div className="mb-24">
        <PageSectionHeading icon={<Boxes className="text-primary h-6 w-6" />}>
          {t(
            "pricing_what_starter_already_includes",
            "What the starter already includes",
          )}
        </PageSectionHeading>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {includedCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.id} className="shadow-sm">
                <CardHeader>
                  <div className="bg-primary/10 text-primary border-primary/20 mb-4 flex h-12 w-12 items-center justify-center border">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="text-primary h-5 w-5" />
              {t(
                "pricing_important_notes_before_you_buy",
                "Important notes before you buy",
              )}
            </CardTitle>
            <CardDescription>
              {t(
                "pricing_repo_already_contains_real_billing_code",
                "The repo already contains real billing code, but your commercial packaging still needs to match your business.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            {notes.map((note, index) => (
              <div key={index} className="border-border border p-4">
                {note}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>
              {t(
                "pricing_current_payment_provider",
                "Current payment provider",
              )}
            </CardTitle>
            <CardDescription>
              {t(
                "pricing_checkout_billing_portal_routes_configured_provider",
                "Checkout and billing portal routes are configured for the provider below.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-border bg-muted/30 border p-5">
              <p className="text-muted-foreground text-sm uppercase">
                {t("pricing_provider", "Provider")}
              </p>
              <p className="text-foreground mt-2 font-mono text-2xl font-bold uppercase">
                {PAYMENT_PROVIDER}
              </p>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/features" locale={locale}>
                  {t(
                    "pricing_review_included_modules",
                    "Review included modules",
                  )}
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/contact" locale={locale}>
                  {t("pricing_talk_through_fit", "Talk through fit")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MarketingPageShell>
  );
}
