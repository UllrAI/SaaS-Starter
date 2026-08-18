import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionContainer } from "@/components/layout/page-container";
import { LocalizedLink } from "@/components/localized-link";
import {
  ArrowRight,
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
  guide,
}: {
  category: React.ReactNode;
  description: React.ReactNode;
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: React.ReactNode;
  guide?: {
    href: string;
    label: React.ReactNode;
  };
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
          {guide && (
            <LocalizedLink
              href={guide.href}
              className="text-primary inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
            >
              {guide.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </LocalizedLink>
          )}
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
  const localizedGuidePath = {
    architecture:
      locale === "en"
        ? "/blog/nextjs-16-saas-starter-architecture"
        : "/blog/saas-starter-kit-developer-guide",
    agents:
      locale === "en"
        ? "/blog/api-keys-oauth-device-flow-saas-agents"
        : "/blog/agent-friendly-saas-template",
    billing:
      locale === "en"
        ? "/blog/stripe-nextjs-billing-production-guide"
        : "/blog/saas-starter-kit-developer-guide",
  } as const;
  const features = [
    {
      id: "app-router",
      title: <>{t("home_next_js_app_router_foundation")}</>,
      description: <>{t("home_route_groups_metadata")}</>,
      icon: Package2,
      category: <>{t("home_architecture")}</>,
      guide: {
        href: localizedGuidePath.architecture,
        label: <>{t("home_nextjs_architecture_guide")}</>,
      },
    },
    {
      id: "auth",
      title: <>{t("home_authentication_permissions")}</>,
      description: <>{t("home_auth_guarded_routes")}</>,
      icon: LockKeyhole,
      category: <>{t("home_auth")}</>,
    },
    {
      id: "agents",
      title: <>{t("home_agent_ready_api_cli_auth")}</>,
      description: <>{t("home_api_keys_cli_device_login_refresh")}</>,
      icon: KeyRound,
      category: <>{t("home_agents")}</>,
      guide: {
        href: localizedGuidePath.agents,
        label: <>{t("home_agent_auth_guide")}</>,
      },
    },
    {
      id: "billing",
      title: <>{t("home_billing_workflow")}</>,
      description: <>{t("home_stripe_checkout_flow")}</>,
      icon: CreditCard,
      category: <>{t("home_monetization")}</>,
      guide: {
        href: localizedGuidePath.billing,
        label: <>{t("home_stripe_billing_guide")}</>,
      },
    },
    {
      id: "admin",
      title: <>{t("home_admin_operations")}</>,
      description: <>{t("home_management_screens")}</>,
      icon: LayoutDashboard,
      category: <>{t("home_operations")}</>,
    },
    {
      id: "data",
      title: <>{t("home_typed_database_layer")}</>,
      description: <>{t("home_drizzle_models_query_helpers_server_side")}</>,
      icon: Database,
      category: <>{t("home_data")}</>,
    },
    {
      id: "uploads",
      title: <>{t("home_direct_server_uploads")}</>,
      description: <>{t("home_r2_upload_flows")}</>,
      icon: BadgeCheck,
      category: <>{t("home_storage")}</>,
    },
    {
      id: "content",
      title: <>{t("home_content_seo_primitives")}</>,
      description: <>{t("home_markdown_blog_collections")}</>,
      icon: FileText,
      category: <>{t("home_content")}</>,
    },
    {
      id: "i18n",
      title: <>{t("home_localization_ready_routing")}</>,
      description: <>{t("home_locale_persistence")}</>,
      icon: Globe,
      category: <>{t("home_i18n")}</>,
    },
    {
      id: "testing",
      title: <>{t("home_testing_regression_coverage")}</>,
      description: <>{t("home_jest_playwright_coverage")}</>,
      icon: ShieldCheck,
      category: <>{t("home_quality")}</>,
    },
  ];
  const featureStats = [
    {
      id: "modules",
      label: <>{t("home_core_modules")}</>,
      value: <span translate="no">10</span>,
    },
    {
      id: "locales",
      label: <>{t("home_locales_shipped")}</>,
      value: <span translate="no">2</span>,
    },
    {
      id: "billing-options",
      label: <>{t("home_checkout_modes")}</>,
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
              {t("home_included_modules")}
            </span>
          </Badge>

          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            <>{t("home_starter_opinionated_where_it_should")}</>
            <span className="text-primary mt-1 block">
              <>{t("home_extensible_where_it_matters")}</>
            </span>
          </h2>

          <p className="text-muted-foreground mt-6 text-lg">
            <>{t("home_not_demo_landing_page_wrapped_around")}</>
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
