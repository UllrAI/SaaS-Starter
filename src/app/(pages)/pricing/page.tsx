import React from "react";
import { createMetadata } from "@/lib/metadata";
import { PricingSection } from "@/components/payment-options";
import { PAYMENT_PROVIDER } from "@/lib/config/constants";
import {
  Check,
  Zap,
  Shield,
  Info,
  ShieldCheck,
  Award,
  X,
  Flag,
} from "lucide-react";

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

import { BackgroundPattern } from "@/components/ui/background-pattern";

export default function PricingPage() {
  return (
    <section className="flex min-h-screen flex-col">
      {/* Background Pattern */}
      <div className="bg-background relative grow overflow-hidden">
        <BackgroundPattern />

        <div className="relative px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <div className="border-border bg-background/50 mb-6 inline-flex items-center rounded-full border px-3 py-1 text-sm backdrop-blur-sm">
                <span className="text-muted-foreground">
                  💰 Transparent Pricing
                </span>
              </div>
              <h1 className="text-foreground mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Simple, transparent pricing
              </h1>
              <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
                Choose the plan that works best for your needs. No hidden fees,
                no surprises. Start building today.
              </p>
            </div>

            <PricingSection />

            {/* Customer Assurance Section */}
            <div className="mt-20 text-center">
              <div className="mx-auto max-w-4xl">
                <h3 className="text-foreground mb-4 text-2xl font-semibold">
                  Why choose our platform?
                </h3>
                <p className="text-muted-foreground mb-8">
                  Join thousands of satisfied customers who trust our secure,
                  reliable platform
                </p>

                <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-4">
                  <div className="border-border bg-background/50 hover:bg-background/80 flex flex-col items-center gap-3 rounded-xl border p-6 transition-colors">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-foreground mb-1 font-semibold">
                        7-Day Free Trial
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Full money-back*
                      </p>
                    </div>
                  </div>

                  <div className="border-border bg-background/50 hover:bg-background/80 flex flex-col items-center gap-3 rounded-xl border p-6 transition-colors">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-foreground mb-1 font-semibold">
                        Instant Activation
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Start using immediately
                      </p>
                    </div>
                  </div>

                  <div className="border-border bg-background/50 hover:bg-background/80 flex flex-col items-center gap-3 rounded-xl border p-6 transition-colors">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-foreground mb-1 font-semibold">
                        Enterprise Security
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Bank-grade protection
                      </p>
                    </div>
                  </div>

                  <div className="border-border bg-background/50 hover:bg-background/80 flex flex-col items-center gap-3 rounded-xl border p-6 transition-colors">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                      <Info className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-foreground mb-1 font-semibold">
                        24/7 Support
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Always here to help
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-border bg-background/50 mb-4 inline-flex items-center rounded-full border px-4 py-2 text-sm backdrop-blur-sm">
                  <span className="text-muted-foreground">💬 Need Help?</span>
                </div>
                <p className="text-muted-foreground">
                  Have questions about our pricing?{" "}
                  <a
                    href="/contact"
                    className="text-primary font-medium transition-colors hover:underline"
                  >
                    Contact our team
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Compliance Section */}
      <div className="bg-muted/20 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h3 className="text-foreground mb-3 text-xl font-semibold">
              Security & Compliance
            </h3>
            <p className="text-muted-foreground">
              Industry-leading security standards and certifications
            </p>
          </div>

          {/* Security Badges */}
          <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="bg-background/60 border-border/50 flex flex-col items-center rounded-lg border p-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-center text-xs font-medium">
                SSL Encrypted
              </span>
            </div>

            <div className="bg-background/60 border-border/50 flex flex-col items-center rounded-lg border p-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-center text-xs font-medium">
                SOC 2 Compliant
              </span>
            </div>

            <div className="bg-background/60 border-border/50 flex flex-col items-center rounded-lg border p-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <X className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-center text-xs font-medium">
                GDPR Ready
              </span>
            </div>

            <div className="bg-background/60 border-border/50 flex flex-col items-center rounded-lg border p-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Flag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-center text-xs font-medium">
                PCI DSS Level 1
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="text-center">
            <p className="text-muted-foreground mb-6 text-sm">
              Accepted payment methods
            </p>
            <div className="mb-8 flex items-center justify-center gap-4">
              <div className="bg-background border-border/50 flex h-8 items-center rounded border px-3 opacity-70 transition-opacity hover:opacity-100">
                <span className="text-xs font-bold">VISA</span>
              </div>
              <div className="bg-background border-border/50 flex h-8 items-center rounded border px-3 opacity-70 transition-opacity hover:opacity-100">
                <span className="text-xs font-bold">MC</span>
              </div>
              <div className="bg-background border-border/50 flex h-8 items-center rounded border px-3 opacity-70 transition-opacity hover:opacity-100">
                <span className="text-xs font-bold">AMEX</span>
              </div>
              <div className="bg-background border-border/50 flex h-8 items-center rounded border px-3 opacity-70 transition-opacity hover:opacity-100">
                <span className="text-xs font-bold">PayPal</span>
              </div>
              <div className="bg-background border-border/50 flex h-8 items-center rounded border px-3 opacity-70 transition-opacity hover:opacity-100">
                <span className="text-xs font-bold">Apple Pay</span>
              </div>
            </div>

            {/* Powered by */}
            <div className="border-border/30 border-t pt-6">
              <p className="text-muted-foreground text-xs">
                Powered by{" "}
                <span className="text-primary font-semibold capitalize">
                  {PAYMENT_PROVIDER}
                </span>{" "}
                - Modern Payment Infrastructure
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
