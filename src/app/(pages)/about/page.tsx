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
    title: t("dcbcddb08da8", "About Us"),
    description: t(
      "738d96acb3ec",
      "Learn about our mission to help developers build and launch SaaS products faster with real, tested, and agent-friendly foundations.",
    ),
    openGraph: {
      title: t("56484a099905", "About Us"),
      description: t(
        "8657781dfed4",
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
      title: t("d53727d26488", "About Us"),
      description: t(
        "ef16e86ea5be",
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
                {t("47d2f67d382a", "README.md")}
              </span>
            </Badge>
          }
        >
          <PageIntroHeading>
            {t("a548106ca626", "Building the future of SaaS")}
          </PageIntroHeading>
          <PageIntroDescription>
            {t(
              "07102d1ab9fa",
              "This starter focuses on real SaaS foundations: authentication, billing, database access, uploads, localization, and operational screens that can be inspected, tested, and extended without replacing placeholder flows first.",
            )}
          </PageIntroDescription>
        </PageIntro>

        <div className="mb-24">
          <PageSectionHeading
            icon={<Terminal className="text-primary h-6 w-6" />}
          >
            {t("edcd2a5b1739", "Core Principles")}
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="bg-primary/10 text-primary border-primary/20 mb-4 flex h-12 w-12 items-center justify-center border">
                  <Zap className="h-6 w-6" />
                </div>
                <CardTitle>
                  {t("0646fd4af9db", "Practical Workflow Speed")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "968cfe723315",
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
                  {t("ab52be4cfa25", "Security Boundaries")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "e0651c9e8d2c",
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
                  {t("9a92b2f918be", "Maintainable Defaults")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "a5ef9f037036",
                    "The code favors ordinary Next.js conventions, small modules, and reusable components over framework tricks or hidden generators.",
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        <div className="mb-24">
          <PageSectionHeading icon={<Users className="text-primary h-6 w-6" />}>
            {t("492dd43ed958", "What You Can Verify")}
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>{t("1722062dfe43", "Real Checkout Flow")}</CardTitle>
                <CardDescription>
                  {t(
                    "ea1140bc6bc8",
                    "Pricing actions call the billing provider abstraction and return users through a verifiable payment status page.",
                  )}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>
                  {t("a8811ad25407", "Protected App Routes")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "ad35a59a4592",
                    "Dashboard, settings, and admin areas use the same route protection and session boundaries as production features.",
                  )}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>{t("f4217c42d973", "Repository Content")}</CardTitle>
                <CardDescription>
                  {t(
                    "d14985bd43af",
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
            {t("523111aac9c9", "Maintenance Model")}
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>{t("54be371c8938", "Code Over Claims")}</CardTitle>
                <CardDescription>
                  {t(
                    "453c97a71789",
                    "Project capabilities are represented by implemented routes, configuration, tests, and documentation instead of invented release milestones.",
                  )}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>
                  {t("ac3bdad7cedf", "Small, Reviewable Changes")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "37d70e1ab0da",
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
              {t("bee6c832c1f1", "Ready to Build Something Amazing?")}
            </PageIntroHeading>
            <PageIntroDescription className="mb-8 text-lg">
              {t(
                "bf22e396ed21",
                "Build a SaaS product that works well for end users, internal tooling, and agent-friendly automation from day one.",
              )}
            </PageIntroDescription>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/pricing" locale={locale}>
                  {t("6ea7de9594bc", "Get Started Today")}
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact" locale={locale}>
                  {t("a2d38631c005", "Contact Sales")}
                </Link>
              </Button>
            </div>
          </PageIntro>
        </SectionContainer>
      </section>
    </>
  );
}
