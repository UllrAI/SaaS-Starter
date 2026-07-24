import { useTranslation } from "@/lib/i18n/translation/client";
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
  KeyRound,
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
  icon: React.ComponentType<{
    className?: string;
  }>;
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
  const { t } = useTranslation();
  const features = [
    {
      id: "app-router",
      title: <>{t("2a7f6db9d00e", "Next.js App Router foundation")}</>,
      description: (
        <>
          {t(
            "81d406068b4b",
            "Route groups, metadata helpers, loading states, error boundaries, and page conventions are already wired in the codebase.",
          )}
        </>
      ),
      icon: Package2,
      category: <>{t("96d4d4386b31", "Architecture")}</>,
    },
    {
      id: "auth",
      title: <>{t("2e664c26bd68", "Authentication and permissions")}</>,
      description: (
        <>
          {t(
            "47e49e3f11bf",
            "Better Auth sessions, guarded dashboard routes, role checks, and auth flows for login, signup, and magic-link style access.",
          )}
        </>
      ),
      icon: LockKeyhole,
      category: <>{t("4214e4138bdf", "Auth")}</>,
    },
    {
      id: "agents",
      title: <>{t("76cb1a4888b2", "Agent-ready API and CLI auth")}</>,
      description: (
        <>
          {t(
            "f9c1c5463afa",
            "API keys, CLI device login, refresh rotation, and versioned machine endpoints give scripts and agent (OpenClaw, Codex, Claude Code, etc.) access without reusing browser session cookies.",
          )}
        </>
      ),
      icon: KeyRound,
      category: <>{t("4aa16669c99e", "Agents")}</>,
    },
    {
      id: "billing",
      title: <>{t("2805f598df0a", "Billing workflow")}</>,
      description: (
        <>
          {t(
            "01ed835ba925",
            "Creem checkout, customer portal handoff, webhook handling, and subscription records are connected end to end.",
          )}
        </>
      ),
      icon: CreditCard,
      category: <>{t("4c5dfa07ffa5", "Monetization")}</>,
    },
    {
      id: "admin",
      title: <>{t("8dcee1eb4398", "Admin operations")}</>,
      description: (
        <>
          {t(
            "c97eb71bd830",
            "User, payment, subscription, and upload management screens give you a working back office instead of an empty shell.",
          )}
        </>
      ),
      icon: LayoutDashboard,
      category: <>{t("f0d79f88be99", "Operations")}</>,
    },
    {
      id: "data",
      title: <>{t("bec5ab8f77d8", "Typed database layer")}</>,
      description: (
        <>
          {t(
            "4b6337801809",
            "Drizzle models, query helpers, and server-side data access keep the app consistent without hand-written SQL scattered around the UI.",
          )}
        </>
      ),
      icon: Database,
      category: <>{t("46f7328fd129", "Data")}</>,
    },
    {
      id: "uploads",
      title: <>{t("08f4b54d4a2a", "Direct and server uploads")}</>,
      description: (
        <>
          {t(
            "f43b3a465650",
            "Cloudflare R2 upload flows support browser uploads, server uploads, and administrative cleanup without leaking storage details into the UI.",
          )}
        </>
      ),
      icon: BadgeCheck,
      category: <>{t("797c390d45bd", "Storage")}</>,
    },
    {
      id: "content",
      title: <>{t("46fb5edc50e4", "Content and SEO primitives")}</>,
      description: (
        <>
          {t(
            "a50b52f09a19",
            "Markdown blog content, Content Collections indexing, metadata generation, sitemap output, and structured page shells are included for marketing content.",
          )}
        </>
      ),
      icon: FileText,
      category: <>{t("70fa72afaaec", "Content")}</>,
    },
    {
      id: "i18n",
      title: <>{t("8fd380ac8e0d", "Localization-ready routing")}</>,
      description: (
        <>
          {t(
            "757206ab1a04",
            "Locale persistence, marketing URL handling, and translated UI strings are in place for Multilingual.",
          )}
        </>
      ),
      icon: Globe,
      category: <>{t("5ac9ef992ec6", "i18n")}</>,
    },
    {
      id: "testing",
      title: <>{t("f4e02f5943e6", "Testing and regression coverage")}</>,
      description: (
        <>
          {t(
            "2ad21d1bf18d",
            "Jest covers units and routes, while Playwright smoke tests exercise auth redirects, API key flows, CLI device auth, admin gating, and locale routing in a real browser.",
          )}
        </>
      ),
      icon: ShieldCheck,
      category: <>{t("d9e036962711", "Quality")}</>,
    },
  ];
  const featureStats = [
    {
      id: "modules",
      label: <>{t("33932dee9281", "Core modules")}</>,
      value: <span translate="no">10</span>,
    },
    {
      id: "locales",
      label: <>{t("ace8e772cf97", "Locales shipped")}</>,
      value: <span translate="no">2</span>,
    },
    {
      id: "billing-options",
      label: <>{t("29beba63acbc", "Checkout modes")}</>,
      value: <span translate="no">3</span>,
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
              {t("0ed711b36d48", "INCLUDED_MODULES")}
            </span>
          </Badge>

          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            <>
              {t(
                "91bb04528f02",
                "The starter is opinionated where it should be,",
              )}
            </>
            <span className="text-primary mt-1 block">
              <>{t("a2fddbd1be6d", "and extensible where it matters.")}</>
            </span>
          </h2>

          <p className="text-muted-foreground mt-6 text-lg">
            <>
              {t(
                "d7d725238979",
                "This is not a demo landing page wrapped around empty routes. The major app surfaces already exist and share the same design system and data model.",
              )}
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
