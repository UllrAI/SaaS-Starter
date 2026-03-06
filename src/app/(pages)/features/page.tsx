import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Features } from "@/components/homepage/features";
import { CheckCircle2, Package2, Wrench } from "lucide-react";
import { createPageMetadata } from "@/lib/i18n/page-metadata";

async function FeaturesPageMetadataTitle() {
  return <>Features</>;
}

async function FeaturesPageMetadataDescription() {
  return (
    <>
      Review the actual modules included in the SaaS Starter: auth, billing,
      admin tooling, uploads, localization, and content infrastructure.
    </>
  );
}

export async function generateMetadata() {
  return createPageMetadata({
    title: FeaturesPageMetadataTitle,
    description: FeaturesPageMetadataDescription,
  });
}

const includedItems = [
  function FeaturesIncludedItemAppRouter() {
    return <>Next.js App Router structure with page/layout conventions</>;
  },
  function FeaturesIncludedItemAuth() {
    return <>Better Auth login, signup, session, and permission guards</>;
  },
  function FeaturesIncludedItemBilling() {
    return <>Creem checkout, portal redirect, subscription records, and webhooks</>;
  },
  function FeaturesIncludedItemAdmin() {
    return <>Admin pages for users, payments, subscriptions, and uploads</>;
  },
  function FeaturesIncludedItemUploads() {
    return <>Cloudflare R2 upload flows for browser and server uploads</>;
  },
  function FeaturesIncludedItemContent() {
    return <>Keystatic blog content and marketing pages</>;
  },
];

const customizationItems = [
  function FeaturesCustomizationItemProduct() {
    return <>Your own product logic, domain-specific data model, and integrations</>;
  },
  function FeaturesCustomizationItemInfrastructure() {
    return <>Production infrastructure, deployment, secrets, and observability</>;
  },
  function FeaturesCustomizationItemBrand() {
    return <>Brand assets, copy, and plan definitions that match your business</>;
  },
  function FeaturesCustomizationItemProviders() {
    return <>Provider credentials for auth, billing, email, storage, and analytics</>;
  },
];

export default function FeaturesPage() {
  return (
    <>
      <section className="bg-background border-border border-b py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="border-primary text-primary mb-4">
              <Package2 className="mr-2 h-3 w-3" />
              <>Starter scope</>
            </Badge>
            <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
              <>Everything included is here because it already exists in code.</>
            </h1>
            <p className="text-muted-foreground mt-6 text-lg leading-8">
              <>
                This page describes the current implementation, not a roadmap or
                marketing wish list. It is the fastest way to see what you can
                reuse immediately and what still belongs to your product team.
              </>
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="text-primary h-5 w-5" />
                  Included today
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed">
                {includedItems.map((Item, index) => (
                  <div key={`${Item.name}-${index}`} className="flex items-start gap-3">
                    <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <Item />
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="text-primary h-5 w-5" />
                  You still configure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed">
                {customizationItems.map((Item, index) => (
                  <div key={`${Item.name}-${index}`} className="flex items-start gap-3">
                    <Wrench className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <Item />
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Features />
    </>
  );
}
