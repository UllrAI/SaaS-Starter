import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Terminal, Zap, Shield, Users, GitBranch } from "lucide-react";
import Link from "next/link";
import { BackgroundPattern } from "@/components/ui/background-pattern";
import { SectionContainer } from "@/components/layout/page-container";
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
      "Learn about our mission to help developers build and launch SaaS products faster with real, tested foundations.",
    openGraph: {
      ...metadata.openGraph,
      title: "About Us",
      description:
        "Learn about our mission to help developers build and launch SaaS products faster with real, tested foundations.",
    },
    twitter: {
      ...metadata.twitter,
      title: "About Us",
      description:
        "Learn about our mission to help developers build and launch SaaS products faster with real, tested foundations.",
    },
  };
}

export default function AboutPage() {
  return (
    <section className="flex min-h-screen flex-col">
      {/* Background Pattern */}
      <div className="bg-background relative grow overflow-hidden">
        <BackgroundPattern />

        <div className="relative py-16">
          <SectionContainer>
            {/* Header */}
            <div className="mx-auto mb-20 max-w-3xl text-center">
              <Badge className="border-border bg-background/50 mb-6 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
                <span className="text-muted-foreground font-mono">
                  README.md
                </span>
              </Badge>
              <h1 className="text-foreground mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Building the future of SaaS
              </h1>
              <p className="text-muted-foreground text-xl leading-relaxed">
                We are a team of developers, designers, and creators building
                the tools we wish we had. Open source at heart, practical in
                execution, and serious about documented, regression-tested
                product foundations.
              </p>
            </div>

            {/* Values / Core Principles */}
            <div className="mb-24">
              <div className="mb-10 flex items-center gap-2 border-b pb-4">
                <Terminal className="text-primary h-6 w-6" />
                <h2 className="text-2xl font-bold">Core Principles</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <Card className="shadow-sm">
                  <CardHeader>
                    <div className="bg-primary/10 text-primary border-primary/20 mb-4 flex h-12 w-12 items-center justify-center border">
                      <Zap className="h-6 w-6" />
                    </div>
                    <CardTitle>Speed as a Feature</CardTitle>
                    <CardDescription>
                      We optimize for milliseconds. Performance isn&apos;t just
                      a metric, it&apos;s a user experience requirement.
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

            {/* Team / Maintainers */}
            <div className="mb-24">
              <div className="mb-10 flex items-center gap-2 border-b pb-4">
                <Users className="text-primary h-6 w-6" />
                <h2 className="text-2xl font-bold">Core Maintainers</h2>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="overflow-hidden p-0 shadow-sm">
                    {/* Image Section - Full Bleed (no padding) */}
                    <div className="bg-muted aspect-square w-full">
                      <div className="text-muted-foreground/20 flex h-full w-full items-center justify-center">
                        <Users className="h-24 w-24" />
                      </div>
                    </div>

                    {/* Content Section - With Padding */}
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

            {/* Timeline / Changelog */}
            <div>
              <div className="mb-10 flex items-center gap-2 border-b pb-4">
                <GitBranch className="text-primary h-6 w-6" />
                <h2 className="text-2xl font-bold">Changelog</h2>
              </div>

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
                    Public beta launch with core features.
                  </p>
                </div>

                <div className="relative">
                  <div className="bg-muted-foreground border-background absolute top-1 -left-[41px] h-5 w-5 rounded-full border-4" />
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      v0.1.0
                    </Badge>
                    <span className="text-muted-foreground text-sm">
                      June 2022
                    </span>
                  </div>
                  <h3 className="text-xl font-bold">First Commit</h3>
                  <p className="text-muted-foreground mt-2">
                    Development started on the core engine.
                  </p>
                </div>
              </div>
            </div>
          </SectionContainer>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-24">
        <SectionContainer>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Ready to Build Something Amazing?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Join thousands of developers who are already building the next
              generation of SaaS products.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/pricing">Get Started Today</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </SectionContainer>
      </section>
    </section>
  );
}
