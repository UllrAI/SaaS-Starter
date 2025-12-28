import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Database,
  Palette,
  Rocket,
  Shield,
  BarChart3,
  CreditCard,
  Code,
} from "lucide-react";

interface Feature {
  id: string;
  title: React.ReactNode;
  description: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  category: React.ReactNode;
}

function FeatureCard({ feature }: { feature: Feature }) {
  const IconComponent = feature.icon;

  return (
    <Card className="group border-border bg-card hover:border-primary hover:bg-secondary/50 h-full border p-6 transition-all">
      <div className="space-y-4">
        {/* Icon and Category */}
        <div className="flex items-center justify-between">
          <div className="bg-secondary text-primary border-border group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground flex h-12 w-12 items-center justify-center border transition-colors">
            <IconComponent className="h-6 w-6" />
          </div>
          <Badge variant="outline" className="border-border font-mono text-xs">
            {feature.category}
          </Badge>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-foreground text-lg font-bold">{feature.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function Features() {
  const features: Feature[] = [
    {
      id: "auth-users",
      title: <>Authentication & Users</>,
      description: (
        <>
          Complete auth system with OAuth, magic links, and user management.
          Role-based access control included.
        </>
      ),
      icon: Shield,
      category: <>Security</>,
    },
    {
      id: "payments-billing",
      title: <>Payments & Billing</>,
      description: (
        <>
          Flexible payment integration with subscriptions, and billing
          management. Revenue tracking built-in.
        </>
      ),
      icon: CreditCard,
      category: <>Payments</>,
    },
    {
      id: "database-api",
      title: <>Database & API</>,
      description: (
        <>
          Type-safe database with Drizzle ORM. RESTful APIs and real-time
          subscriptions ready.
        </>
      ),
      icon: Database,
      category: <>Backend</>,
    },
    {
      id: "analytics-insights",
      title: <>Analytics & Insights</>,
      description: (
        <>
          User behavior tracking, conversion metrics, and beautiful dashboards
          for data-driven decisions.
        </>
      ),
      icon: BarChart3,
      category: <>Analytics</>,
    },
    {
      id: "modern-ui-ux",
      title: <>Modern UI/UX</>,
      description: (
        <>
          Beautiful, responsive design with dark mode. Accessible components
          and smooth animations.
        </>
      ),
      icon: Palette,
      category: <>Design</>,
    },
    {
      id: "production-deploy",
      title: <>Production Deploy</>,
      description: (
        <>
          One-click deployment to Vercel, AWS, or Docker. CI/CD pipelines and
          monitoring included.
        </>
      ),
      icon: Rocket,
      category: <>DevOps</>,
    },
  ];

  const featureStats: {
    id: string;
    label: React.ReactNode;
    value: React.ReactNode;
  }[] = [
    {
      id: "components",
      label: <>Components</>,
      value: <span data-lingo-skip>50+</span>,
    },
    {
      id: "integrations",
      label: <>Integrations</>,
      value: <span data-lingo-skip>10+</span>,
    },
    {
      id: "type-safe",
      label: <>Type Safe</>,
      value: <span data-lingo-skip>100%</span>,
    },
  ];

  return (
    <section className="bg-background border-border relative border-b py-24">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="outline" className="border-primary text-primary mb-4">
            <Code className="mr-2 h-3 w-3" />
            <>Features</>
          </Badge>

          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            <>Everything you need to</>
            <span className="text-primary mt-1 block">
              <>build and scale</>
            </span>
          </h2>

          <p className="text-muted-foreground mt-6 text-lg">
            <>
              Skip months of development. Our SaaS Starter includes all the
              essential features you need to launch your product.
            </>
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>

        {/* Bottom Stats */}
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
      </div>
    </section>
  );
}
