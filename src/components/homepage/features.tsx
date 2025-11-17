import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Database,
  Palette,
  Rocket,
  Shield,
  BarChart3,
  Sparkles,
  CreditCard,
} from "lucide-react";

interface Feature {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

const features: Feature[] = [
  {
    title: "Authentication & Users",
    description:
      "Complete auth system with OAuth, magic links, and user management. Role-based access control included.",
    icon: Shield,
    category: "Security",
  },
  {
    title: "Payments & Billing",
    description:
      "Stripe integration with subscriptions, invoicing, and tax handling. Revenue tracking built-in.",
    icon: CreditCard,
    category: "Payments",
  },
  {
    title: "Database & API",
    description:
      "Type-safe database with Drizzle ORM. RESTful APIs and real-time subscriptions ready.",
    icon: Database,
    category: "Backend",
  },
  {
    title: "Analytics & Insights",
    description:
      "User behavior tracking, conversion metrics, and beautiful dashboards for data-driven decisions.",
    icon: BarChart3,
    category: "Analytics",
  },
  {
    title: "Modern UI/UX",
    description:
      "Beautiful, responsive design with dark mode. Accessible components and smooth animations.",
    icon: Palette,
    category: "Design",
  },
  {
    title: "Production Deploy",
    description:
      "One-click deployment to Vercel, AWS, or Docker. CI/CD pipelines and monitoring included.",
    icon: Rocket,
    category: "DevOps",
  },
];

const featureStats = [
  { label: "Components", value: "50+" },
  { label: "Integrations", value: "10+" },
  { label: "Type Safe", value: "100%" },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const IconComponent = feature.icon;

  return (
    <Card className="h-full rounded-xl border border-border/70 bg-background/80 p-6 shadow-sm">
      <div className="space-y-4">
        {/* Icon and Category */}
        <div className="flex items-center justify-between">
          <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
            <IconComponent className="h-6 w-6" />
          </div>
          <Badge variant="secondary" className="text-xs">
            {feature.category}
          </Badge>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-foreground text-lg font-semibold">
            {feature.title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function Features() {
  return (
    <section className="relative py-24">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="mr-2 h-3 w-3" />
            Everything Included
          </Badge>

          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to
            <span className="text-primary block">build and scale</span>
          </h2>

          <p className="text-muted-foreground mt-6 text-lg">
            Skip months of development. Our starter includes all the essential
            features you need to launch your SaaS product successfully.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="border-border/60 bg-background/80 mt-16 grid gap-6 rounded-2xl border p-6 text-center sm:grid-cols-3">
          {featureStats.map((stat) => (
            <div key={stat.label}>
              <div className="text-foreground text-2xl font-bold">
                {stat.value}
              </div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
