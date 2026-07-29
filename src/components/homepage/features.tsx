import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
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
export function Features({
  locale = SOURCE_LOCALE,
}: {
  locale?: SupportedLocale;
} = {}) {
  const { t } = getStaticTranslations(locale);
  const features = [
    {
      id: "app-router",
      title: (
        <>
          {t(
            "home_next_js_app_router_foundation",
            "Next.js App Router foundation",
          )}
        </>
      ),
      description: (
        <>
          {t(
            "home_route_groups_metadata_helpers_loading_states",
            "Route groups, metadata helpers, loading states, error boundaries, and page conventions are already wired in the codebase.",
          )}
        </>
      ),
      icon: Package2,
      category: <>{t("home_architecture", "Architecture")}</>,
    },
    {
      id: "auth",
      title: (
        <>
          {t(
            "home_authentication_permissions",
            "Authentication and permissions",
          )}
        </>
      ),
      description: (
        <>
          {t(
            "home_better_auth_sessions_guarded_dashboard_routes",
            "Better Auth sessions, guarded dashboard routes, role checks, and auth flows for login, signup, and magic-link style access.",
          )}
        </>
      ),
      icon: LockKeyhole,
      category: <>{t("home_auth", "Auth")}</>,
    },
    {
      id: "agents",
      title: (
        <>
          {t("home_agent_ready_api_cli_auth", "Agent-ready API and CLI auth")}
        </>
      ),
      description: (
        <>
          {t(
            "home_api_keys_cli_device_login_refresh",
            "API keys, CLI device login, refresh rotation, and versioned machine endpoints give scripts and agent (OpenClaw, Codex, Claude Code, etc.) access without reusing browser session cookies.",
          )}
        </>
      ),
      icon: KeyRound,
      category: <>{t("home_agents", "Agents")}</>,
    },
    {
      id: "billing",
      title: <>{t("home_billing_workflow", "Billing workflow")}</>,
      description: (
        <>
          {t(
            "home_creem_checkout_customer_portal_handoff_webhook",
            "Creem checkout, customer portal handoff, webhook handling, and subscription records are connected end to end.",
          )}
        </>
      ),
      icon: CreditCard,
      category: <>{t("home_monetization", "Monetization")}</>,
    },
    {
      id: "admin",
      title: <>{t("home_admin_operations", "Admin operations")}</>,
      description: (
        <>
          {t(
            "home_user_payment_subscription_upload_management_screens",
            "User, payment, subscription, and upload management screens give you a working back office instead of an empty shell.",
          )}
        </>
      ),
      icon: LayoutDashboard,
      category: <>{t("home_operations", "Operations")}</>,
    },
    {
      id: "data",
      title: <>{t("home_typed_database_layer", "Typed database layer")}</>,
      description: (
        <>
          {t(
            "home_drizzle_models_query_helpers_server_side",
            "Drizzle models, query helpers, and server-side data access keep the app consistent without hand-written SQL scattered around the UI.",
          )}
        </>
      ),
      icon: Database,
      category: <>{t("home_data", "Data")}</>,
    },
    {
      id: "uploads",
      title: (
        <>{t("home_direct_server_uploads", "Direct and server uploads")}</>
      ),
      description: (
        <>
          {t(
            "home_cloudflare_r2_upload_flows_support_browser",
            "Cloudflare R2 upload flows support browser uploads, server uploads, and administrative cleanup without leaking storage details into the UI.",
          )}
        </>
      ),
      icon: BadgeCheck,
      category: <>{t("home_storage", "Storage")}</>,
    },
    {
      id: "content",
      title: (
        <>{t("home_content_seo_primitives", "Content and SEO primitives")}</>
      ),
      description: (
        <>
          {t(
            "home_markdown_blog_content_collections_indexing_metadata",
            "Markdown blog content, Content Collections indexing, metadata generation, sitemap output, and structured page shells are included for marketing content.",
          )}
        </>
      ),
      icon: FileText,
      category: <>{t("home_content", "Content")}</>,
    },
    {
      id: "i18n",
      title: (
        <>
          {t("home_localization_ready_routing", "Localization-ready routing")}
        </>
      ),
      description: (
        <>
          {t(
            "home_locale_persistence_marketing_url_handling_translated",
            "Locale persistence, marketing URL handling, and translated UI strings are in place for Multilingual.",
          )}
        </>
      ),
      icon: Globe,
      category: <>{t("home_i18n", "i18n")}</>,
    },
    {
      id: "testing",
      title: (
        <>
          {t(
            "home_testing_regression_coverage",
            "Testing and regression coverage",
          )}
        </>
      ),
      description: (
        <>
          {t(
            "home_jest_covers_units_routes_while_playwright",
            "Jest covers units and routes, while Playwright smoke tests exercise auth redirects, API key flows, CLI device auth, admin gating, and locale routing in a real browser.",
          )}
        </>
      ),
      icon: ShieldCheck,
      category: <>{t("home_quality", "Quality")}</>,
    },
  ];
  const featureStats = [
    {
      id: "modules",
      label: <>{t("home_core_modules", "Core modules")}</>,
      value: <span translate="no">10</span>,
    },
    {
      id: "locales",
      label: <>{t("home_locales_shipped", "Locales shipped")}</>,
      value: <span translate="no">2</span>,
    },
    {
      id: "billing-options",
      label: <>{t("home_checkout_modes", "Checkout modes")}</>,
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
              {t("home_included_modules", "INCLUDED_MODULES")}
            </span>
          </Badge>

          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            <>
              {t(
                "home_starter_opinionated_where_it_should",
                "The starter is opinionated where it should be,",
              )}
            </>
            <span className="text-primary mt-1 block">
              <>
                {t(
                  "home_extensible_where_it_matters",
                  "and extensible where it matters.",
                )}
              </>
            </span>
          </h2>

          <p className="text-muted-foreground mt-6 text-lg">
            <>
              {t(
                "home_not_demo_landing_page_wrapped_around",
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
