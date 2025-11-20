import React from "react";
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
} from "lucide-react";
import Link from "next/link";
import { createMetadata } from "@/lib/metadata";
import { BackgroundPattern } from "@/components/ui/background-pattern";

export const metadata = createMetadata({
  title: "About Us",
  description:
    "Learn about our mission to help developers build and launch SaaS products faster than ever before.",
});

export default function AboutPage() {
  return (
    <section className="flex min-h-screen flex-col">
      {/* Background Pattern */}
      <div className="bg-background relative grow overflow-hidden">
        <BackgroundPattern />

        <div className="relative px-4 py-16">
          <div className="mx-auto max-w-6xl">
            {/* Header */}
            <div className="mb-20 text-center">
              <Badge className="border-border bg-background/50 mb-6 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
                <span className="text-muted-foreground font-mono">
                  README.md
                </span>
              </Badge>
              <h1 className="text-foreground mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Building the future of SaaS
              </h1>
              <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
                We are a team of developers, designers, and creators building the
                tools we wish we had. Open source at heart, enterprise in scale.
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
                    <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center border border-primary/20">
                      <Zap className="h-6 w-6" />
                    </div>
                    <CardTitle>Speed as a Feature</CardTitle>
                    <CardDescription>
                      We optimize for milliseconds. Performance isn&apos;t just a
                      metric, it&apos;s a user experience requirement.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center border border-primary/20">
                      <Shield className="h-6 w-6" />
                    </div>
                    <CardTitle>Security First</CardTitle>
                    <CardDescription>
                      We don&apos;t treat security as an afterthought. It&apos;s baked into
                      our architecture from line one.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center border border-primary/20">
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
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
                        <Users className="h-24 w-24" />
                      </div>
                    </div>

                    {/* Content Section - With Padding */}
                    <div className="p-6">
                      <CardTitle className="text-lg mb-1.5">
                        Dev Member {i}
                      </CardTitle>
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

              <div className="border-l-2 border-muted ml-4 space-y-12 pl-8">
                <div className="relative">
                  <div className="bg-primary absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-background" />
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
                  <div className="bg-muted-foreground absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-background" />
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
                  <div className="bg-muted-foreground absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-background" />
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
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
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
        </div>
      </section>
    </section>
  );
}
