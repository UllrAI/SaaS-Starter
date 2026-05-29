import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Terminal, Zap, Shield, Users, Info } from "lucide-react";
import Link from "next/link";
import { SectionContainer } from "@/components/layout/page-container";
import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import {
  PageIntro,
  PageIntroDescription,
  PageIntroHeading,
} from "@/components/layout/page-intro";
import { PageSectionHeading } from "@/components/layout/page-section-heading";
import { createLocalizedAlternates } from "@/lib/metadata";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { APP_NAME, OGIMAGE, TWITTERACCOUNT } from "@/lib/config/constants";
import env from "@/env";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const alternates = createLocalizedAlternates("/about", locale);
  const canonical = alternates.canonical;
  const canonicalUrl =
    typeof canonical === "string" || canonical instanceof URL
      ? canonical
      : undefined;

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
    alternates,
    title: "About Us",
    description:
      "Learn about our mission to help developers build and launch SaaS products faster with real, tested, and agent-friendly foundations.",
    openGraph: {
      title: "About Us",
      description:
        "Learn about our mission to help developers build and launch SaaS products faster with real, tested, and agent-friendly foundations.",
      url: canonicalUrl,
      images: OGIMAGE,
      siteName: APP_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      creator: TWITTERACCOUNT,
      title: "About Us",
      description:
        "Learn about our mission to help developers build and launch SaaS products faster with real, tested, and agent-friendly foundations.",
      images: OGIMAGE,
    },
  };
}

export default function AboutPage() {
  return (
    <>
      <MarketingPageShell>
        <PageIntro
          className="mb-20"
          badge={
            <Badge className="border-border bg-background/50 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
              <Info className="text-muted-foreground mr-2 h-3 w-3" />
              <span className="text-muted-foreground font-mono">README.md</span>
            </Badge>
          }
        >
          <PageIntroHeading>Building the future of SaaS</PageIntroHeading>
          <PageIntroDescription>
            This starter focuses on real SaaS foundations: authentication,
            billing, database access, uploads, localization, and operational
            screens that can be inspected, tested, and extended without
            replacing placeholder flows first.
          </PageIntroDescription>
        </PageIntro>

        <div className="mb-24">
          <PageSectionHeading
            icon={<Terminal className="text-primary h-6 w-6" />}
          >
            Core Principles
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="bg-primary/10 text-primary border-primary/20 mb-4 flex h-12 w-12 items-center justify-center border">
                  <Zap className="h-6 w-6" />
                </div>
                <CardTitle>Practical Workflow Speed</CardTitle>
                <CardDescription>
                  The project is shaped for builders who need to move quickly
                  without losing the ability to understand, test, and modify the
                  code they ship.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <div className="bg-primary/10 text-primary border-primary/20 mb-4 flex h-12 w-12 items-center justify-center border">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle>Security Boundaries</CardTitle>
                <CardDescription>
                  Auth, billing, uploads, and environment configuration are kept
                  behind explicit server-side checks instead of optimistic UI
                  assumptions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <div className="bg-primary/10 text-primary border-primary/20 mb-4 flex h-12 w-12 items-center justify-center border">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle>Maintainable Defaults</CardTitle>
                <CardDescription>
                  The code favors ordinary Next.js conventions, small modules,
                  and reusable components over framework tricks or hidden
                  generators.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        <div className="mb-24">
          <PageSectionHeading icon={<Users className="text-primary h-6 w-6" />}>
            What You Can Verify
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Real Checkout Flow</CardTitle>
                <CardDescription>
                  Pricing actions call the billing provider abstraction and
                  return users through a verifiable payment status page.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Protected App Routes</CardTitle>
                <CardDescription>
                  Dashboard, settings, and admin areas use the same route
                  protection and session boundaries as production features.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Repository Content</CardTitle>
                <CardDescription>
                  Marketing pages, blog content, and legal pages live in the
                  repository so changes can be reviewed with the code.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        <div>
          <PageSectionHeading
            icon={<Shield className="text-primary h-6 w-6" />}
          >
            Maintenance Model
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Code Over Claims</CardTitle>
                <CardDescription>
                  Project capabilities are represented by implemented routes,
                  configuration, tests, and documentation instead of invented
                  release milestones.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Small, Reviewable Changes</CardTitle>
                <CardDescription>
                  Improvements should stay scoped, keep migrations and generated
                  assets aligned, and include the checks needed for confidence.
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
              Ready to Build Something Amazing?
            </PageIntroHeading>
            <PageIntroDescription className="mb-8 text-lg">
              Build a SaaS product that works well for end users, internal
              tooling, and agent-friendly automation from day one.
            </PageIntroDescription>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/pricing">Get Started Today</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </PageIntro>
        </SectionContainer>
      </section>
    </>
  );
}
