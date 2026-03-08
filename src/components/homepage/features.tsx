import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionContainer } from "@/components/layout/page-container";
import {
  BadgeCheck,
  CreditCard,
  Database,
  FileText,
  Globe,
  LayoutDashboard,
  LockKeyhole,
  Package2,
  ShieldCheck,
} from "lucide-react";

function FeatureCard({
  category,
  description,
  icon: Icon,
  title,
}: {
  category: React.ReactNode;
  description: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
}) {
  return (
    <Card className="group border-border bg-card hover:border-primary h-full border p-6 transition-all">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="bg-secondary text-primary border-border group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground flex h-12 w-12 items-center justify-center border transition-colors">
            <Icon className="h-6 w-6" />
          </div>
          <Badge variant="outline" className="border-border font-mono text-xs">
            {category}
          </Badge>
        </div>

        <div className="space-y-2">
          <h3 className="text-foreground text-lg font-bold">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function Features() {
  const features = [
    {
      id: "app-router",
      title: <>Next.js App Router foundation</>,
      description: (
        <>
          Route groups, metadata helpers, loading states, error boundaries, and
          page conventions are already wired in the codebase.
        </>
      ),
      icon: Package2,
      category: <>Architecture</>,
    },
    {
      id: "auth",
      title: <>Authentication and permissions</>,
      description: (
        <>
          Better Auth sessions, guarded dashboard routes, role checks, and auth
          flows for login, signup, and magic-link style access.
        </>
      ),
      icon: LockKeyhole,
      category: <>Auth</>,
    },
    {
      id: "billing",
      title: <>Billing workflow</>,
      description: (
        <>
          Creem checkout, customer portal handoff, webhook handling, and
          subscription records are connected end to end.
        </>
      ),
      icon: CreditCard,
      category: <>Monetization</>,
    },
    {
      id: "admin",
      title: <>Admin operations</>,
      description: (
        <>
          User, payment, subscription, and upload management screens give you a
          working back office instead of an empty shell.
        </>
      ),
      icon: LayoutDashboard,
      category: <>Operations</>,
    },
    {
      id: "data",
      title: <>Typed database layer</>,
      description: (
        <>
          Drizzle models, query helpers, and server-side data access keep the
          app consistent without hand-written SQL scattered around the UI.
        </>
      ),
      icon: Database,
      category: <>Data</>,
    },
    {
      id: "uploads",
      title: <>Direct and server uploads</>,
      description: (
        <>
          Cloudflare R2 upload flows support browser uploads, server uploads,
          and administrative cleanup without leaking storage details into the
          UI.
        </>
      ),
      icon: BadgeCheck,
      category: <>Storage</>,
    },
    {
      id: "content",
      title: <>Content and SEO primitives</>,
      description: (
        <>
          Markdown blog content, Content Collections indexing, metadata
          generation, sitemap output, and structured page shells are included
          for marketing content.
        </>
      ),
      icon: FileText,
      category: <>Content</>,
    },
    {
      id: "i18n",
      title: <>Localization-ready routing</>,
      description: (
        <>
          Locale persistence, marketing URL handling, and translated UI strings
          are in place for Multilingual.
        </>
      ),
      icon: Globe,
      category: <>i18n</>,
    },
    {
      id: "testing",
      title: <>Testing and regression coverage</>,
      description: (
        <>
          Jest covers units and routes, while Playwright smoke tests exercise
          auth redirects, admin gating, and locale routing in a real browser.
        </>
      ),
      icon: ShieldCheck,
      category: <>Quality</>,
    },
  ];

  const featureStats = [
    {
      id: "modules",
      label: <>Core modules</>,
      value: <span data-lingo-skip>9</span>,
    },
    {
      id: "locales",
      label: <>Locales shipped</>,
      value: <span data-lingo-skip>2</span>,
    },
    {
      id: "billing-options",
      label: <>Checkout modes</>,
      value: <span data-lingo-skip>3</span>,
    },
  ];

  return (
    <section
      id="features"
      className="bg-background border-border border-b py-24"
    >
      <SectionContainer>
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge className="border-border bg-background/50 mb-4 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
            <Package2 className="text-muted-foreground mr-2 h-3 w-3" />
            <span className="text-muted-foreground font-mono">
              INCLUDED_MODULES
            </span>
          </Badge>

          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            <>The starter is opinionated where it should be,</>
            <span className="text-primary mt-1 block">
              <>and extensible where it matters.</>
            </span>
          </h2>

          <p className="text-muted-foreground mt-6 text-lg">
            <>
              This is not a demo landing page wrapped around empty routes. The
              major app surfaces already exist and share the same design system
              and data model.
            </>
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.id} {...feature} />
          ))}
        </div>

        <div className="bg-border border-border mt-16 grid gap-px border sm:grid-cols-3">
          {featureStats.map((stat) => (
            <div
              key={stat.id}
              className="bg-card hover:bg-secondary/50 p-8 text-center transition-colors"
            >
              <div className="text-foreground text-4xl font-bold tracking-tighter">
                {stat.value}
              </div>
              <div className="text-muted-foreground mt-2 text-sm tracking-widest uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
