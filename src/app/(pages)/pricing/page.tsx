import { useTranslation } from "@/lib/i18n/translation/client";
import { getServerTranslations } from "@/lib/i18n/translation/server";
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
import { SOURCE_LOCALE } from "@/lib/config/i18n";
import {
  Boxes,
  CreditCard,
  Database,
  Info,
  LockKeyhole,
  Upload,
} from "lucide-react";
export async function generateMetadata() {
  const { t } = await getServerTranslations();
  const metadata = createMetadataDefaults({
    alternates: createLocalizedAlternates("/pricing", SOURCE_LOCALE),
  });
  return {
    ...metadata,
    title: t("0f6aee7772a1", "Pricing"),
    description: t(
      "1b1610e6ec50",
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
      title: t("faf8cbd01ed8", "Pricing"),
      description: t(
        "fd9e4f058bc7",
        "Pricing for the SaaS Starter codebase. Review the current package structure, verification stack, and what is included before checkout.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("b6e81f7c5d90", "Pricing"),
      description: t(
        "eccca2ef193a",
        "Pricing for the SaaS Starter codebase. Review the current package structure, verification stack, and what is included before checkout.",
      ),
    },
  };
}
export default function PricingPage() {
  const { t } = useTranslation();
  const includedCards = [
    {
      id: "auth",
      icon: LockKeyhole,
      title: <>{t("e3209482e6a1", "Auth and permissions")}</>,
      description: (
        <>
          {t(
            "f94e2026f177",
            "Login, signup, session handling, protected routes, and admin gating are already implemented.",
          )}
        </>
      ),
    },
    {
      id: "billing",
      icon: CreditCard,
      title: <>{t("0d890cf52427", "Billing workflow")}</>,
      description: (
        <>
          {t(
            "b675a07e329c",
            "Checkout, portal access, webhooks, subscription records, and billing screens are part of the starter.",
          )}
        </>
      ),
    },
    {
      id: "data",
      icon: Database,
      title: <>{t("2681dfbf4a36", "Data and admin")}</>,
      description: (
        <>
          {t(
            "9b6b5706587f",
            "Drizzle-backed data access and admin pages for users, payments, subscriptions, and uploads ship together.",
          )}
        </>
      ),
    },
    {
      id: "uploads",
      icon: Upload,
      title: <>{t("d77385e365ae", "Uploads and storage")}</>,
      description: (
        <>
          {t(
            "fb83a03eb23c",
            "Browser uploads, server uploads, and Cloudflare R2 integration are included for file-heavy products.",
          )}
        </>
      ),
    },
  ];
  const notes = [
    <>
      {t(
        "a99b87e56faa",
        "This project is a self-hosted starter. Hosting, secrets, observability, and production operations stay with you.",
      )}
    </>,
    <>
      {t(
        "ace7b7f71bad",
        "The payment flow in this repo is currently wired to Creem. Replace or extend it if your business uses another provider.",
      )}
    </>,
    <>
      {t(
        "e2541d37fc74",
        "Plan definitions, feature entitlements, and lifecycle messaging should be updated to reflect your real commercial offer before launch.",
      )}
    </>,
    <>
      {t(
        "da3415c49b3e",
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
              {t("09c302a391a9", "STARTER_PRICING")}
            </span>
          </Badge>
        }
      >
        <PageIntroHeading>
          {t("c47f84c7ff49", "Simple, transparent pricing")}
        </PageIntroHeading>
        <PageIntroDescription className="mx-auto max-w-3xl">
          {t(
            "7bf637ae804a",
            "Choose the plan that fits you. No hidden fees, no surprises.",
          )}
        </PageIntroDescription>
      </PageIntro>

      <div className="mb-24">
        <PricingSection />
      </div>

      <div className="mb-24">
        <PageSectionHeading icon={<Boxes className="text-primary h-6 w-6" />}>
          {t("1acf75608dba", "What the starter already includes")}
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
              {t("cdd8afd6d7fe", "Important notes before you buy")}
            </CardTitle>
            <CardDescription>
              {t(
                "243a81cf7dfd",
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
              {t("7883eb326bcc", "Current payment provider")}
            </CardTitle>
            <CardDescription>
              {t(
                "467f2b02e948",
                "Checkout and billing portal routes are configured for the provider below.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-border bg-muted/30 border p-5">
              <p className="text-muted-foreground text-sm uppercase">
                {t("55acc893dd3a", "Provider")}
              </p>
              <p className="text-foreground mt-2 font-mono text-2xl font-bold uppercase">
                {PAYMENT_PROVIDER}
              </p>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/features">
                  {t("5e7e631987bc", "Review included modules")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/contact">
                  {t("fed723d3bdb1", "Talk through fit")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MarketingPageShell>
  );
}
