import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Blocks,
  Code2,
  CreditCard,
  Database,
  Globe,
  ShieldCheck,
  Upload,
} from "lucide-react";

const stackHighlights = [
  {
    id: "next",
    icon: Blocks,
    Title: function StackHighlightTitleNext() {
      return <>Built on current App Router patterns</>;
    },
    Description: function StackHighlightDescriptionNext() {
      return (
        <>
          Layouts, route handlers, metadata, and server components are organized
          around modern Next.js conventions instead of legacy Pages Router
          code.
        </>
      );
    },
  },
  {
    id: "react",
    icon: Code2,
    Title: function StackHighlightTitleReact() {
      return <>Clear server and client boundaries</>;
    },
    Description: function StackHighlightDescriptionReact() {
      return (
        <>
          Interactive parts stay client-side, while page composition, data
          fetching, and structure remain on the server where they belong.
        </>
      );
    },
  },
  {
    id: "auth",
    icon: ShieldCheck,
    Title: function StackHighlightTitleAuth() {
      return <>Role-aware access control</>;
    },
    Description: function StackHighlightDescriptionAuth() {
      return (
        <>
          User and admin experiences are separated with explicit permission
          checks, not just hidden navigation links.
        </>
      );
    },
  },
];

const starterModules = [
  {
    id: "billing",
    icon: CreditCard,
    Label: function StarterModuleLabelBilling() {
      return <>Billing and subscriptions</>;
    },
  },
  {
    id: "database",
    icon: Database,
    Label: function StarterModuleLabelDatabase() {
      return <>Drizzle and Postgres data layer</>;
    },
  },
  {
    id: "uploads",
    icon: Upload,
    Label: function StarterModuleLabelUploads() {
      return <>Cloudflare R2 file storage</>;
    },
  },
  {
    id: "i18n",
    icon: Globe,
    Label: function StarterModuleLabelI18n() {
      return <>Multilingual Support</>;
    },
  },
];

export function SocialProofUnified() {
  return (
    <section className="bg-muted/30 border-border border-b py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Badge variant="outline" className="border-primary text-primary mb-4">
              <ShieldCheck className="mr-2 h-3 w-3" />
              <>What is actually here</>
            </Badge>

            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              <>The starter is credible because the code paths already exist.</>
            </h2>

            <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-8">
              <>
                The project already includes the modules most teams end up
                rebuilding: auth, billing, uploads, admin screens, content
                pages, and localization plumbing.
              </>
            </p>

            <div className="mt-10 grid gap-4">
              {stackHighlights.map((item) => {
                const Icon = item.icon;
                const Title = item.Title;
                const Description = item.Description;

                return (
                  <Card key={item.id} className="border-border bg-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <span className="bg-secondary text-primary flex h-10 w-10 items-center justify-center border">
                          <Icon className="h-5 w-5" />
                        </span>
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

          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Starter modules</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {starterModules.map((module) => {
                  const Icon = module.icon;
                  const Label = module.Label;

                  return (
                    <div
                      key={module.id}
                      className="border-border flex items-center gap-3 border p-4"
                    >
                      <span className="bg-secondary text-primary flex h-9 w-9 items-center justify-center border">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium">
                        <Label />
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Project stance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <p className="text-muted-foreground">
                  <>
                    This repo is a self-hosted starter, not a hosted SaaS
                    platform. You own deployment, infrastructure, credentials,
                    and production operations.
                  </>
                </p>
                <p className="text-muted-foreground">
                  <>
                    The value is the integration work already done for you:
                    consistent UI, typed data boundaries, and working flows
                    between auth, billing, storage, and admin tooling.
                  </>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
