"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Check,
  Zap,
  Calendar,
  CreditCard,
  Loader2,
  LogIn,
  Terminal,
} from "lucide-react";
import { PRODUCT_TIERS, type PricingTier } from "@/lib/config/products";
import { useSession } from "@/lib/auth/client";
import { useRouter } from "nextjs-toploader/app";
import type { PaymentMode, BillingCycle } from "@/types/billing";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

// Helper: Format Price
const formatPrice = (price: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
};

export function PricingSection({ className }: { className?: string }) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("subscription");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [loadingState, setLoadingState] = useState<{
    tierId: string;
    mode: PaymentMode;
    cycle?: BillingCycle;
  } | null>(null);

  const { data: session, isPending: isSessionLoading } = useSession();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCheckout = async (
    tier: PricingTier,
    mode: PaymentMode,
    cycle?: BillingCycle,
  ) => {
    if (!session?.user) {
      toast.error("Please log in to continue purchase.", {
        action: {
          label: "Login",
          onClick: () => router.push("/login?redirect=/pricing"),
        },
      });
      router.push("/login?redirect=/pricing");
      return;
    }

    setLoadingState({ tierId: tier.id, mode, cycle });
    toast.info("Initializing secure checkout sequence...");

    let isRedirecting = false;

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tierId: tier.id,
          paymentMode: mode,
          billingCycle: cycle,
        }),
      });

      const data = await response.json();

      if (response.status === 409) {
        toast.error(data.error || "Subscription already active.", {
          action: {
            label: "Manage Plan",
            onClick: () => {
              if (data.managementUrl) {
                window.location.href = data.managementUrl;
              }
            },
          },
        });
        return;
      }

      if (response.ok && data.checkoutUrl) {
        isRedirecting = true;
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || "Failed to create checkout session.");
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
      );
    } finally {
      if (!isRedirecting) {
        setLoadingState(null);
      }
    }
  };

  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4", className)}>
      {/* Payment Mode Selection */}
      <div className="mb-8 text-center">
        <Tabs
          value={paymentMode}
          onValueChange={(v) => setPaymentMode(v as PaymentMode)}
          className="mx-auto w-full max-w-sm"
        >
          <TabsList className="bg-muted/50 grid h-11 w-full grid-cols-2 p-1">
            <TabsTrigger
              value="subscription"
              className="data-[state=active]:bg-background flex items-center gap-2 text-sm font-medium transition-all data-[state=active]:shadow-sm"
            >
              <Calendar className="h-4 w-4" /> Subscription
            </TabsTrigger>
            <TabsTrigger
              value="one_time"
              className="data-[state=active]:bg-background flex items-center gap-2 text-sm font-medium transition-all data-[state=active]:shadow-sm"
            >
              <CreditCard className="h-4 w-4" /> Lifetime
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Billing Cycle Toggle */}
      {paymentMode === "subscription" && (
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="bg-muted/30 flex items-center justify-center gap-3 rounded-full border p-1">
            <Label
              htmlFor="billing-toggle"
              className={cn(
                "cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-all select-none",
                billingCycle === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={billingCycle === "yearly"}
              onCheckedChange={(checked) =>
                setBillingCycle(checked ? "yearly" : "monthly")
              }
              className="data-[state=checked]:bg-primary"
            />
            <Label
              htmlFor="billing-toggle"
              className={cn(
                "cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-all select-none",
                billingCycle === "yearly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Yearly
            </Label>
          </div>
          <div className="flex h-7 items-center justify-center">
            {billingCycle === "yearly" && (
              <Badge
                variant="outline"
                className="animate-in fade-in-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 duration-300 dark:text-emerald-400"
              >
                <Zap className="mr-1.5 h-3 w-3" /> Save 17%
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
        {PRODUCT_TIERS.map((tier) => {
          const price =
            paymentMode === "one_time"
              ? tier.prices.oneTime
              : billingCycle === "yearly"
                ? tier.prices.yearly
                : tier.prices.monthly;

          const isLoading =
            loadingState?.tierId === tier.id &&
            loadingState.mode === paymentMode &&
            (paymentMode === "one_time" || loadingState.cycle === billingCycle);

          const isDisabled = !mounted || isLoading || isSessionLoading;

          return (
            <Card
              key={tier.id}
              className={cn(
                "relative flex flex-col transition-all duration-300",
                tier.isPopular
                  ? "border-primary shadow-lg ring-1 ring-primary/20"
                  : "hover:border-primary/50 shadow-sm hover:shadow-md",
              )}
            >
              {tier.isPopular && (
                <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary px-3 py-1 text-xs font-bold shadow-sm">
                    RECOMMENDED
                  </Badge>
                </div>
              )}

              <CardHeader className="pt-8 pb-6 text-center">
                <CardTitle className="text-foreground mb-2 text-xl font-bold">
                  {tier.name}
                </CardTitle>
                <CardDescription className="text-muted-foreground mx-auto max-w-[200px] text-sm leading-relaxed">
                  {tier.description}
                </CardDescription>
                <div className="mt-6 space-y-2">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-foreground font-mono text-4xl font-bold tracking-tight">
                      {paymentMode === "one_time"
                        ? formatPrice(price, tier.currency)
                        : billingCycle === "monthly"
                          ? formatPrice(price, tier.currency)
                          : formatPrice(Math.round(price / 12), tier.currency)}
                    </span>
                    {paymentMode === "subscription" && (
                      <span className="text-muted-foreground font-mono text-sm">
                        /mo
                      </span>
                    )}
                  </div>
                  <div className="flex h-5 items-center justify-center">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      {paymentMode === "one_time" ? (
                        <>One-time payment</>
                      ) : billingCycle === "yearly" ? (
                        <>Billed annually</>
                      ) : (
                        <>Billed monthly</>
                      )}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col px-6 pt-0 pb-8">
                <div className="bg-muted/30 mb-6 h-px w-full" />
                <div className="mb-8 flex-1 space-y-4">
                  {tier.features.map((feature, index) => (
                    <div
                      key={index}
                      className="group/feature flex items-start gap-3"
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border transition-colors",
                          feature.included
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-muted bg-muted/50 text-muted-foreground",
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      <span
                        className={cn(
                          "text-sm leading-tight transition-colors",
                          feature.included
                            ? "text-foreground"
                            : "text-muted-foreground line-through opacity-70",
                        )}
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                {!mounted || isSessionLoading ? (
                  <Skeleton className="h-11 w-full" />
                ) : (
                  <Button
                    className={cn(
                      "h-11 w-full font-bold shadow-sm transition-all",
                      tier.isPopular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                        : "bg-background hover:bg-accent hover:text-accent-foreground border",
                    )}
                    onClick={() =>
                      handleCheckout(tier, paymentMode, billingCycle)
                    }
                    variant={tier.isPopular ? "default" : "outline"}
                    disabled={isDisabled}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        PROCESSING
                      </>
                    ) : !session?.user ? (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        LOGIN TO BUY
                      </>
                    ) : (
                      <>
                        GET {tier.name.toUpperCase()}
                        <Terminal className="ml-2 h-4 w-4 opacity-50" />
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
