import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  BadgeCheck,
  CreditCard,
  Database,
  FileText,
  Globe,
  LayoutDashboard,
  LockKeyhole,
  Package2,
} from "lucide-react";

interface Feature {
  id: string;
  Title: React.ComponentType;
  Description: React.ComponentType;
  icon: React.ComponentType<{ className?: string }>;
  Category: React.ComponentType;
}

const features: Feature[] = [
  {
    id: "app-router",
    Title: function FeatureTitleAppRouter() {
      return <>Next.js App Router foundation</>;
    },
    Description: function FeatureDescriptionAppRouter() {
      return (
        <>
          Route groups, metadata helpers, loading states, error boundaries, and
          page conventions are already wired in the codebase.
        </>
      );
    },
    icon: Package2,
    Category: function FeatureCategoryArchitecture() {
      return <>Architecture</>;
    },
  },
  {
    id: "auth",
    Title: function FeatureTitleAuth() {
      return <>Authentication and permissions</>;
    },
    Description: function FeatureDescriptionAuth() {
      return (
        <>
          Better Auth sessions, guarded dashboard routes, role checks, and auth
          flows for login, signup, and magic-link style access.
        </>
      );
    },
    icon: LockKeyhole,
    Category: function FeatureCategoryAuth() {
      return <>Auth</>;
    },
  },
  {
    id: "billing",
    Title: function FeatureTitleBilling() {
      return <>Billing workflow</>;
    },
    Description: function FeatureDescriptionBilling() {
      return (
        <>
          Creem checkout, customer portal handoff, webhook handling, and
          subscription records are connected end to end.
        </>
      );
    },
    icon: CreditCard,
    Category: function FeatureCategoryMonetization() {
      return <>Monetization</>;
    },
  },
  {
    id: "admin",
    Title: function FeatureTitleAdmin() {
      return <>Admin operations</>;
    },
    Description: function FeatureDescriptionAdmin() {
      return (
        <>
          User, payment, subscription, and upload management screens give you a
          working back office instead of an empty shell.
        </>
      );
    },
    icon: LayoutDashboard,
    Category: function FeatureCategoryOperations() {
      return <>Operations</>;
    },
  },
  {
    id: "data",
    Title: function FeatureTitleData() {
      return <>Typed database layer</>;
    },
    Description: function FeatureDescriptionData() {
      return (
        <>
          Drizzle models, query helpers, and server-side data access keep the
          app consistent without hand-written SQL scattered around the UI.
        </>
      );
    },
    icon: Database,
    Category: function FeatureCategoryData() {
      return <>Data</>;
    },
  },
  {
    id: "uploads",
    Title: function FeatureTitleUploads() {
      return <>Direct and server uploads</>;
    },
    Description: function FeatureDescriptionUploads() {
      return (
        <>
          Cloudflare R2 upload flows support browser uploads, server uploads,
          and administrative cleanup without leaking storage details into the
          UI.
        </>
      );
    },
    icon: BadgeCheck,
    Category: function FeatureCategoryStorage() {
      return <>Storage</>;
    },
  },
  {
    id: "content",
    Title: function FeatureTitleContent() {
      return <>Content and SEO primitives</>;
    },
    Description: function FeatureDescriptionContent() {
      return (
        <>
          Markdown blog content, Content Collections indexing, metadata
          generation, sitemap output, and structured page shells are included
          for marketing content.
        </>
      );
    },
    icon: FileText,
    Category: function FeatureCategoryContent() {
      return <>Content</>;
    },
  },
  {
    id: "i18n",
    Title: function FeatureTitleI18n() {
      return <>Localization-ready routing</>;
    },
    Description: function FeatureDescriptionI18n() {
      return (
        <>
          Locale persistence, marketing URL handling, and translated UI strings
          are in place for Multilingual.
        </>
      );
    },
    icon: Globe,
    Category: function FeatureCategoryI18n() {
      return <>i18n</>;
    },
  },
];

const featureStats = [
  {
    id: "modules",
    Label: function FeatureStatLabelModules() {
      return <>Core modules</>;
    },
    value: <span data-lingo-skip>8</span>,
  },
  {
    id: "locales",
    Label: function FeatureStatLabelLocales() {
      return <>Locales shipped</>;
    },
    value: <span data-lingo-skip>2</span>,
  },
  {
    id: "billing-options",
    Label: function FeatureStatLabelCheckoutModes() {
      return <>Checkout modes</>;
    },
    value: <span data-lingo-skip>3</span>,
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  const Title = feature.Title;
  const Description = feature.Description;
  const Category = feature.Category;

  return (
    <Card className="group border-border bg-card hover:border-primary h-full border p-6 transition-all">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="bg-secondary text-primary border-border group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground flex h-12 w-12 items-center justify-center border transition-colors">
            <Icon className="h-6 w-6" />
          </div>
          <Badge variant="outline" className="border-border font-mono text-xs">
            <Category />
          </Badge>
        </div>

        <div className="space-y-2">
          <h3 className="text-foreground text-lg font-bold">
            <Title />
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            <Description />
          </p>
        </div>
      </div>
    </Card>
  );
}

export function Features() {
  return (
    <section id="features" className="bg-background border-border border-b py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="outline" className="border-primary text-primary mb-4">
            <Package2 className="mr-2 h-3 w-3" />
            <>Included modules</>
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>

        <div className="bg-border border-border mt-16 grid gap-px border sm:grid-cols-3">
          {featureStats.map((stat) => {
            const Label = stat.Label;

            return (
              <div
                key={stat.id}
                className="bg-card hover:bg-secondary/50 p-8 text-center transition-colors"
              >
                <div className="text-foreground text-4xl font-bold tracking-tighter">
                  {stat.value}
                </div>
                <div className="text-muted-foreground mt-2 text-sm tracking-widest uppercase">
                  <Label />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
