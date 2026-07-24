import { useTranslation } from "@/lib/i18n/translation/client";
import { getServerTranslations } from "@/lib/i18n/translation/server";
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
import { SOURCE_LOCALE } from "@/lib/config/i18n";
export async function generateMetadata() {
  const { t } = await getServerTranslations();
  const metadata = createMetadataDefaults({
    alternates: createLocalizedAlternates("/features", SOURCE_LOCALE),
  });
  return {
    ...metadata,
    title: t("3066d18a9353", "Features"),
    description: t(
      "574e5c0dfd61",
      "Review the actual modules included in the SaaS Starter: auth, agent-ready APIs, CLI device auth, billing, admin tooling, uploads, localization, content infrastructure, and E2E smoke coverage.",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("89726523c9d8", "Features"),
      description: t(
        "b2f32e9e2b99",
        "Review the actual modules included in the SaaS Starter: auth, agent-ready APIs, CLI device auth, billing, admin tooling, uploads, localization, content infrastructure, and E2E smoke coverage.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("b15c21ba6e9e", "Features"),
      description: t(
        "bba3ef238890",
        "Review the actual modules included in the SaaS Starter: auth, agent-ready APIs, CLI device auth, billing, admin tooling, uploads, localization, content infrastructure, and E2E smoke coverage.",
      ),
    },
  };
}
export default function FeaturesPage() {
  const { t } = useTranslation();
  const includedItems = [
    <>
      {t(
        "90c8216f7003",
        "Next.js App Router structure with page/layout conventions",
      )}
    </>,
    <>
      {t(
        "50efeda0fa84",
        "Better Auth login, signup, session, and permission guards",
      )}
    </>,
    <>
      {t(
        "722c5c5143e8",
        "API keys, CLI device login, and versioned `/api/v1/*` machine auth routes",
      )}
    </>,
    <>
      {t(
        "b8882e039cf4",
        "Creem checkout, portal, subscription records, and webhooks",
      )}
    </>,
    <>
      {t(
        "2a76f83b6397",
        "Admin pages for users, payments, subscriptions, and uploads",
      )}
    </>,
    <>
      {t(
        "41c2b7079b63",
        "Cloudflare R2 upload flows for browser and server uploads",
      )}
    </>,
    <>
      {t(
        "7d92d3db117c",
        "Markdown blog content, typed collections, and marketing pages",
      )}
    </>,
    <>
      {t(
        "94e552f228cc",
        "Playwright smoke coverage for auth, API key flows, CLI auth, admin, and locale routing",
      )}
    </>,
  ];
  const customizationItems = [
    <>
      {t(
        "b1f73a16f7e9",
        "Your own product logic, domain-specific data model, and integrations",
      )}
    </>,
    <>
      {t(
        "37cf87afc594",
        "Production infrastructure, deployment, secrets, and observability",
      )}
    </>,
    <>
      {t(
        "1895e5f9ed0d",
        "Brand assets, copy, and plan definitions that match your business",
      )}
    </>,
    <>
      {t(
        "5f4cbefebe30",
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
                {t("cfc8e2b1b876", "STARTER_SCOPE")}
              </span>
            </Badge>
          }
        >
          <PageIntroHeading>
            {t("2394a342a71d", "Shipped and ready to scale")}
          </PageIntroHeading>
          <PageIntroDescription>
            {t(
              "edb54b41a6e2",
              "Every feature listed here exists in the codebase today. No roadmaps or placeholders. Just tested foundations for human users, APIs, and agent workflows you can reuse immediately.",
            )}
          </PageIntroDescription>
        </PageIntro>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="text-primary h-5 w-5" />
                {t("d955f2dd58b3", "Included today")}
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
                {t("570ae678dc3e", "You still configure")}
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

      <Features />
    </>
  );
}
