import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Check,
  Zap,
  Shield,
  Info,
  ShieldCheck,
  Award,
  Flag,
  DollarSign,
  Lock,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { createMetadata } from "@/lib/metadata";
import { PricingSection } from "@/components/payment-options";
import { PAYMENT_PROVIDER } from "@/lib/config/constants";
import { BackgroundPattern } from "@/components/ui/background-pattern";

export const metadata = createMetadata({
  title: "Pricing Plans - Choose Your Perfect Plan",
  description:
    "Simple, transparent pricing for every business size. Start with our free plan or choose from our flexible subscription options. 7-Day money-back guarantee included.",
  keywords: [
    "pricing",
    "plans",
    "subscription",
    "saas pricing",
    "business plans",
  ],
});

export default function PricingPage() {
  return (
    <section className="flex min-h-screen flex-col">
      {/* Background Pattern */}
      <div className="bg-background relative grow overflow-hidden">
        <BackgroundPattern />

        <div className="relative px-4 py-16">
          <div className="mx-auto max-w-6xl">
            {/* Header */}
            <div className="mb-20 text-center">
              <Badge className="border-border bg-background/50 mb-6 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
                <span className="text-muted-foreground font-mono">
                  PRICING.md
                </span>
              </Badge>
              <h1 className="text-foreground mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Simple, transparent pricing
              </h1>
              <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
                Choose the plan that works best for your needs. No hidden fees,
                no surprises. Start building today.
              </p>
            </div>

            {/* Pricing Plans */}
            <div className="mb-24">
              <PricingSection />
            </div>

            {/* Platform Specifications */}
            <div className="mb-24">
              <div className="mb-10 flex items-center gap-2 border-b pb-4">
                <Zap className="text-primary h-6 w-6" />
                <h2 className="text-2xl font-bold">Platform Specifications</h2>
              </div>

              <p className="text-muted-foreground mb-8 text-center">
                Core infrastructure capabilities included in all plans
              </p>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm">
                  <CardHeader>
                    <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center border border-primary/20">
                      <Check className="h-6 w-6" />
                    </div>
                    <CardTitle>7-Day Trial</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      NO_CC_REQUIRED
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Full access to all features. No credit card required for
                      dev environment.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center border border-primary/20">
                      <Zap className="h-6 w-6" />
                    </div>
                    <CardTitle>Instant Provisioning</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      AUTOMATED_SETUP
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Your environment is ready in less than 60 seconds. Zero
                      configuration needed.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center border border-primary/20">
                      <Shield className="h-6 w-6" />
                    </div>
                    <CardTitle>Enterprise Grade</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      SOC2_TYPE_II
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Compliant infrastructure with 99.99% uptime SLA guarantee.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center border border-primary/20">
                      <Info className="h-6 w-6" />
                    </div>
                    <CardTitle>24/7 Support</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      ENGINEERING_DIRECT
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Direct access to engineering team via Slack or Discord.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Security & Compliance */}
            <div className="mb-24">
              <div className="mb-10 flex items-center gap-2 border-b pb-4">
                <Lock className="text-primary h-6 w-6" />
                <h2 className="text-2xl font-bold">Security & Compliance</h2>
              </div>

              <p className="text-muted-foreground mb-8 text-center font-mono text-sm">
                /security/certifications
              </p>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm">
                  <CardHeader className="text-center">
                    <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-primary/20">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <CardTitle className="font-mono text-sm">
                      SSL_ENCRYPTED
                    </CardTitle>
                    <CardDescription className="text-xs">
                      TLS 1.3
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="text-center">
                    <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-primary/20">
                      <Award className="h-6 w-6" />
                    </div>
                    <CardTitle className="font-mono text-sm">
                      SOC2_COMPLIANT
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Type II
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="text-center">
                    <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-primary/20">
                      <Shield className="h-6 w-6" />
                    </div>
                    <CardTitle className="font-mono text-sm">
                      GDPR_READY
                    </CardTitle>
                    <CardDescription className="text-xs">
                      EU Data Protection
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="text-center">
                    <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-primary/20">
                      <Flag className="h-6 w-6" />
                    </div>
                    <CardTitle className="font-mono text-sm">PCI_DSS</CardTitle>
                    <CardDescription className="text-xs">
                      Level 1
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <div className="mb-10 flex items-center gap-2 border-b pb-4">
                <CreditCard className="text-primary h-6 w-6" />
                <h2 className="text-2xl font-bold">Supported Payment Methods</h2>
              </div>

              <div className="mb-8 flex flex-wrap justify-center gap-3">
                {["VISA", "Mastercard", "AMEX", "PayPal", "Apple Pay"].map(
                  (method) => (
                    <Badge
                      key={method}
                      variant="outline"
                      className="border-border bg-background px-4 py-2 font-mono text-xs shadow-sm"
                    >
                      {method}
                    </Badge>
                  ),
                )}
              </div>

              <div className="text-center">
                <p className="text-muted-foreground font-mono text-sm">
                  infrastructure_provider:{" "}
                  <span className="text-primary font-bold uppercase">
                    {PAYMENT_PROVIDER}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Need a Custom Plan?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Enterprise customers with specific requirements can contact our
              sales team for tailored solutions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/contact">Contact Sales</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
