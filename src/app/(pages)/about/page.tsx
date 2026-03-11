import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Terminal,
  Zap,
  Shield,
  Users,
  GitBranch,
  Info,
} from "lucide-react";
import Link from "next/link";
import { SectionContainer } from "@/components/layout/page-container";
import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import {
  PageIntro,
  PageIntroDescription,
  PageIntroHeading,
} from "@/components/layout/page-intro";
import { PageSectionHeading } from "@/components/layout/page-section-heading";
import { createLocalizedAlternates, createMetadata } from "@/lib/metadata";
import { getRequestLocale } from "@/lib/i18n/server-locale";

export async function generateMetadata() {
  const locale = await getRequestLocale();
  const metadata = createMetadata({
    alternates: createLocalizedAlternates("/about", locale),
  });

  return {
    ...metadata,
    title: "About Us",
    description:
      "Learn about our mission to help developers build and launch SaaS products faster with real, tested, and agent-friendly foundations.",
    openGraph: {
      ...metadata.openGraph,
      title: "About Us",
      description:
        "Learn about our mission to help developers build and launch SaaS products faster with real, tested, and agent-friendly foundations.",
    },
    twitter: {
      ...metadata.twitter,
      title: "About Us",
      description:
        "Learn about our mission to help developers build and launch SaaS products faster with real, tested, and agent-friendly foundations.",
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
            We are a team of developers, designers, and creators building the
            tools we wish we had. Open source at heart, practical in execution,
            and serious about documented, regression-tested foundations for
            both human users and agent (OpenClaw, Codex, Claude Code, etc.)
            workflows.
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
                <CardTitle>Human and Agent Workflow Speed</CardTitle>
                <CardDescription>
                  We want the starter to feel fast for browser users, scripts,
                  and agent-driven automation alike. Setup time matters just as
                  much as runtime performance.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <div className="bg-primary/10 text-primary border-primary/20 mb-4 flex h-12 w-12 items-center justify-center border">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle>Security First</CardTitle>
                <CardDescription>
                  We don&apos;t treat security as an afterthought. It&apos;s
                  baked into our architecture from line one.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <div className="bg-primary/10 text-primary border-primary/20 mb-4 flex h-12 w-12 items-center justify-center border">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle>Community Driven</CardTitle>
                <CardDescription>
                  We build in public and listen to our users. Your feedback
                  shapes our roadmap directly.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        <div className="mb-24">
          <PageSectionHeading icon={<Users className="text-primary h-6 w-6" />}>
            Core Maintainers
          </PageSectionHeading>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden p-0 shadow-sm">
                <div className="bg-muted aspect-square w-full">
                  <div className="text-muted-foreground/20 flex h-full w-full items-center justify-center">
                    <Users className="h-24 w-24" />
                  </div>
                </div>

                <div className="p-6">
                  <CardTitle className="text-lg">Dev Member {i}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    Senior Engineer
                  </CardDescription>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <PageSectionHeading
            icon={<GitBranch className="text-primary h-6 w-6" />}
          >
            Changelog
          </PageSectionHeading>

          <div className="border-muted ml-4 space-y-12 border-l-2 pl-8">
            <div className="relative">
              <div className="bg-primary border-background absolute top-1 -left-[41px] h-5 w-5 rounded-full border-4" />
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  v2.0.0
                </Badge>
                <span className="text-muted-foreground text-sm">
                  October 2023
                </span>
              </div>
              <h3 className="text-xl font-bold">Global Scale</h3>
              <p className="text-muted-foreground mt-2">
                Launched multi-region support and edge caching.
              </p>
            </div>

            <div className="relative">
              <div className="bg-muted-foreground border-background absolute top-1 -left-[41px] h-5 w-5 rounded-full border-4" />
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  v1.0.0
                </Badge>
                <span className="text-muted-foreground text-sm">
                  January 2023
                </span>
              </div>
              <h3 className="text-xl font-bold">Initial Release</h3>
              <p className="text-muted-foreground mt-2">
                Public beta launch with core SaaS foundations.
              </p>
            </div>

            <div className="relative">
              <div className="bg-muted-foreground border-background absolute top-1 -left-[41px] h-5 w-5 rounded-full border-4" />
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  v0.1.0
                </Badge>
                <span className="text-muted-foreground text-sm">June 2022</span>
              </div>
              <h3 className="text-xl font-bold">First Commit</h3>
              <p className="text-muted-foreground mt-2">
                Development started on the reusable starter foundation.
              </p>
            </div>
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
