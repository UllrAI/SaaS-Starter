import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackgroundPattern } from "@/components/ui/background-pattern";
import { PricingSection } from "@/components/payment-options";
import { PAYMENT_PROVIDER } from "@/lib/config/constants";
import { createPageMetadata } from "@/lib/i18n/page-metadata";
import {
  Boxes,
  CreditCard,
  Database,
  Info,
  LockKeyhole,
  Upload,
} from "lucide-react";

export async function generateMetadata() {
  return createPageMetadata({
    title: PricingPageMetadataTitle,
    description: PricingPageMetadataDescription,
    keywords: [
      PricingPageKeywordPricing,
      PricingPageKeywordStarterKit,
      PricingPageKeywordNextStarter,
      PricingPageKeywordSaasStarter,
      PricingPageKeywordBilling,
    ],
  });
}

async function PricingPageMetadataTitle() {
  return <>Pricing</>;
}

async function PricingPageMetadataDescription() {
  return (
    <>
      Pricing for the SaaS Starter codebase. Review the current package
      structure, payment flow, and what is included before checkout.
    </>
  );
}

async function PricingPageKeywordPricing() {
  return <>pricing</>;
}

async function PricingPageKeywordStarterKit() {
  return <>starter kit</>;
}

async function PricingPageKeywordNextStarter() {
  return <>next.js starter</>;
}

async function PricingPageKeywordSaasStarter() {
  return <>saas starter</>;
}

async function PricingPageKeywordBilling() {
  return <>billing</>;
}

const includedCards = [
  {
    id: "auth",
    icon: LockKeyhole,
    Title: function PricingIncludedCardTitleAuth() {
      return <>Auth and permissions</>;
    },
    Description: function PricingIncludedCardDescriptionAuth() {
      return (
        <>
          Login, signup, session handling, protected routes, and admin gating
          are already implemented.
        </>
      );
    },
  },
  {
    id: "billing",
    icon: CreditCard,
    Title: function PricingIncludedCardTitleBilling() {
      return <>Billing workflow</>;
    },
    Description: function PricingIncludedCardDescriptionBilling() {
      return (
        <>
          Checkout, portal access, webhooks, subscription records, and billing
          screens are part of the starter.
        </>
      );
    },
  },
  {
    id: "data",
    icon: Database,
    Title: function PricingIncludedCardTitleData() {
      return <>Data and admin</>;
    },
    Description: function PricingIncludedCardDescriptionData() {
      return (
        <>
          Drizzle-backed data access and admin pages for users, payments,
          subscriptions, and uploads ship together.
        </>
      );
    },
  },
  {
    id: "uploads",
    icon: Upload,
    Title: function PricingIncludedCardTitleUploads() {
      return <>Uploads and storage</>;
    },
    Description: function PricingIncludedCardDescriptionUploads() {
      return (
        <>
          Browser uploads, server uploads, and Cloudflare R2 integration are
          included for file-heavy products.
        </>
      );
    },
  },
];

const notes = [
  function PricingNoteSelfHosted() {
    return (
      <>
        This project is a self-hosted starter. Hosting, secrets, observability,
        and production operations stay with you.
      </>
    );
  },
  function PricingNoteProvider() {
    return (
      <>
        The payment flow in this repo is currently wired to Creem. Replace or
        extend it if your business uses another provider.
      </>
    );
  },
  function PricingNoteCommercialOffer() {
    return (
      <>
        Plan definitions, feature entitlements, and lifecycle messaging should
        be updated to reflect your real commercial offer before launch.
      </>
    );
  },
];

export default function PricingPage() {
  return (
    <section className="flex min-h-screen flex-col">
      <div className="bg-background relative grow overflow-hidden">
        <BackgroundPattern />

        <div className="relative px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-20 text-center">
              <Badge className="border-border bg-background/50 mb-6 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
                <Boxes className="mr-2 h-3 w-3" />
                <span className="text-muted-foreground font-mono">
                  STARTER_PRICING
                </span>
              </Badge>
              <h1 className="text-foreground mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Pricing for the codebase, not for a hosted platform
              </h1>
              <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
                Choose the package that matches how much of the starter you want
                to adopt today, then customize the product and infrastructure
                for your own launch.
              </p>
            </div>

            <div className="mb-24">
              <PricingSection />
            </div>

            <div className="mb-24">
              <div className="mb-10 flex items-center gap-2 border-b pb-4">
                <Boxes className="text-primary h-6 w-6" />
                <h2 className="text-2xl font-bold">What the starter already includes</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {includedCards.map((item) => {
                  const Icon = item.icon;
                  const Title = item.Title;
                  const Description = item.Description;

                  return (
                    <Card key={item.id} className="shadow-sm">
                      <CardHeader>
                        <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center border border-primary/20">
                          <Icon className="h-6 w-6" />
                        </div>
                        <CardTitle>
                          <Title />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          <Description />
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="text-primary h-5 w-5" />
                    Important notes before you buy
                  </CardTitle>
                  <CardDescription>
                    The repo already contains real billing code, but your
                    commercial packaging still needs to match your business.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed">
                  {notes.map((Note, index) => (
                    <div key={index} className="border-border border p-4">
                      <Note />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Current payment provider</CardTitle>
                  <CardDescription>
                    Checkout and billing portal routes are configured for the
                    provider below.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-border bg-muted/30 border p-5">
                    <p className="text-muted-foreground text-sm uppercase">
                      Provider
                    </p>
                    <p className="text-foreground mt-2 font-mono text-2xl font-bold uppercase">
                      {PAYMENT_PROVIDER}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button asChild className="w-full">
                      <Link href="/features">Review included modules</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/contact">Talk through fit</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
