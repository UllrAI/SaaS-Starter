import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Features } from "@/components/homepage/features";
import { SectionContainer } from "@/components/layout/page-container";
import {
  PageIntro,
  PageIntroDescription,
  PageIntroHeading,
} from "@/components/layout/page-intro";
import { CheckCircle2, Package2, Wrench } from "lucide-react";
import { createLocalizedAlternates, createMetadata } from "@/lib/metadata";
import { getRequestLocale } from "@/lib/i18n/server-locale";

export async function generateMetadata() {
  const locale = await getRequestLocale();
  const metadata = createMetadata({
    alternates: createLocalizedAlternates("/features", locale),
  });

  return {
    ...metadata,
    title: "Features",
    description:
      "Review the actual modules included in the SaaS Starter: auth, agent-ready APIs, CLI device auth, billing, admin tooling, uploads, localization, content infrastructure, and E2E smoke coverage.",
    openGraph: {
      ...metadata.openGraph,
      title: "Features",
      description:
        "Review the actual modules included in the SaaS Starter: auth, agent-ready APIs, CLI device auth, billing, admin tooling, uploads, localization, content infrastructure, and E2E smoke coverage.",
    },
    twitter: {
      ...metadata.twitter,
      title: "Features",
      description:
        "Review the actual modules included in the SaaS Starter: auth, agent-ready APIs, CLI device auth, billing, admin tooling, uploads, localization, content infrastructure, and E2E smoke coverage.",
    },
  };
}

export default function FeaturesPage() {
  const includedItems = [
    <>Next.js App Router structure with page/layout conventions</>,
    <>Better Auth login, signup, session, and permission guards</>,
    <>API keys, CLI device login, and versioned `/api/v1/*` machine auth routes</>,
    <>Creem checkout, portal, subscription records, and webhooks</>,
    <>Admin pages for users, payments, subscriptions, and uploads</>,
    <>Cloudflare R2 upload flows for browser and server uploads</>,
    <>Markdown blog content, typed collections, and marketing pages</>,
    <>Playwright smoke coverage for auth, API key flows, CLI auth, admin, and locale routing</>,
  ];

  const customizationItems = [
    <>Your own product logic, domain-specific data model, and integrations</>,
    <>Production infrastructure, deployment, secrets, and observability</>,
    <>Brand assets, copy, and plan definitions that match your business</>,
    <>Provider credentials for auth, billing, email, storage, and analytics</>,
  ];
  return (
    <>
      <section className="bg-background border-border border-b py-20">
        <SectionContainer>
          <PageIntro
            badge={
              <Badge className="border-border bg-background/50 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
                <Package2 className="text-muted-foreground mr-2 h-3 w-3" />
                <span className="text-muted-foreground font-mono">
                  STARTER_SCOPE
                </span>
              </Badge>
            }
          >
            <PageIntroHeading className="text-4xl sm:text-5xl lg:text-6xl">
              Shipped and ready to scale
            </PageIntroHeading>
            <PageIntroDescription className="mt-6 text-lg leading-8">
              Every feature listed here exists in the codebase today. No roadmaps
              or placeholders. Just tested foundations for human users, APIs,
              and agent workflows you can reuse immediately.
            </PageIntroDescription>
          </PageIntro>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="text-primary h-5 w-5" />
                  Included today
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
                  You still configure
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
        </SectionContainer>
      </section>

      <Features />
    </>
  );
}
