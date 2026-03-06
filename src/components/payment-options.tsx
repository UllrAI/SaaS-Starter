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
import {
  PRODUCT_TIERS,
  type PricingTier,
} from "@/lib/config/products";
import { useSession } from "@/lib/auth/client";
import { useRouter } from "nextjs-toploader/app";
import type { PaymentMode, BillingCycle } from "@/types/billing";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { useIntlLocale } from "@/hooks/use-intl-locale";
import { getSafeBillingRedirectUrl } from "@/lib/billing/url";
import { defineCopyCatalog } from "@/lib/i18n/copy-catalog";

// Helper: Format Price
const formatPrice = (
  price: number,
  locale: string,
  currency: string = "USD",
) => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(price);
};

const PAYMENT_MODE_COPY = defineCopyCatalog([
  {
    id: "subscription",
    Label: function PricingModeSubscriptionLabel() {
      return <>Subscription</>;
    },
  },
  {
    id: "one_time",
    Label: function PricingModeOneTimeLabel() {
      return <>One-Time</>;
    },
  },
] satisfies ReadonlyArray<{
  id: PaymentMode;
  Label: React.ComponentType;
}>);

const BILLING_CYCLE_COPY = defineCopyCatalog([
  {
    id: "monthly",
    Label: function BillingCycleMonthlyLabel() {
      return <>Monthly</>;
    },
  },
  {
    id: "yearly",
    Label: function BillingCycleYearlyLabel() {
      return <>Yearly</>;
    },
  },
] satisfies ReadonlyArray<{
  id: BillingCycle;
  Label: React.ComponentType;
}>);

const TIER_UI_COPY = defineCopyCatalog([
  {
    id: "discount",
    Label: function BillingCycleDiscountLabel() {
      return <>Save 17%</>;
    },
  },
  {
    id: "recommended",
    Label: function TierBadgeRecommendedLabel() {
      return <>RECOMMENDED</>;
    },
  },
  {
    id: "oneTime",
    Label: function TierBillingOneTimeLabel() {
      return <>One-time purchase, no automatic renewal</>;
    },
  },
  {
    id: "annually",
    Label: function TierBillingAnnualLabel() {
      return <>Billed annually</>;
    },
  },
  {
    id: "monthly",
    Label: function TierBillingMonthlyLabel() {
      return <>Billed monthly</>;
    },
  },
  {
    id: "processing",
    Label: function TierActionProcessingLabel() {
      return <>PROCESSING</>;
    },
  },
  {
    id: "loginToBuy",
    Label: function TierActionLoginToBuyLabel() {
      return <>LOGIN TO BUY</>;
    },
  },
  {
    id: "loginAction",
    Label: function TierToastLoginActionLabel() {
      return <>Login</>;
    },
  },
  {
    id: "managePlanAction",
    Label: function TierToastManagePlanActionLabel() {
      return <>Manage Plan</>;
    },
  },
] as const satisfies ReadonlyArray<{
  id:
    | "discount"
    | "recommended"
    | "oneTime"
    | "annually"
    | "monthly"
    | "processing"
    | "loginToBuy"
    | "loginAction"
    | "managePlanAction";
  Label: React.ComponentType;
}>);

const PRICING_TIER_COPY = defineCopyCatalog([
  {
    id: "plus",
    Description: function TierDescriptionPlus() {
      return <>Core starter package for solo builders shipping the basics</>;
    },
  },
  {
    id: "pro",
    Description: function TierDescriptionPro() {
      return <>Full-featured starter package for teams shipping a real MVP</>;
    },
  },
  {
    id: "team",
    Description: function TierDescriptionTeam() {
      return <>Everything in Professional plus rollout support for teams</>;
    },
  },
] satisfies ReadonlyArray<{
  id: PricingTier["id"];
  Description: React.ComponentType;
}>);

const PRICING_FEATURE_COPY = defineCopyCatalog([
  {
    id: "marketing-foundation",
    Label: function TierFeatureMarketingFoundation() {
      return <>Marketing pages and blog foundation</>;
    },
  },
  {
    id: "auth-dashboard",
    Label: function TierFeatureAuthDashboard() {
      return <>Authentication and protected dashboard</>;
    },
  },
  {
    id: "billing-flow",
    Label: function TierFeatureBillingFlow() {
      return <>Creem checkout and billing portal flow</>;
    },
  },
  {
    id: "admin-operations",
    Label: function TierFeatureAdminOperations() {
      return <>Admin operations screens</>;
    },
  },
  {
    id: "r2-uploads",
    Label: function TierFeatureR2Uploads() {
      return <>Cloudflare R2 upload workflows</>;
    },
  },
  {
    id: "localization-setup",
    Label: function TierFeatureLocalizationSetup() {
      return <>Localization setup</>;
    },
  },
  {
    id: "implementation-guidance",
    Label: function TierFeatureImplementationGuidance() {
      return <>Implementation guidance</>;
    },
  },
] satisfies ReadonlyArray<{
  id:
    | "marketing-foundation"
    | "auth-dashboard"
    | "billing-flow"
    | "admin-operations"
    | "r2-uploads"
    | "localization-setup"
    | "implementation-guidance";
  Label: React.ComponentType;
}>);

function TierActionGetLabel({ tierName }: { tierName: string }) {
  return <>GET {tierName.toUpperCase()}</>;
}

export function PricingSection({ className }: { className?: string }) {
  const intlLocale = useIntlLocale();
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("subscription");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [loadingState, setLoadingState] = useState<{
    tierId: string;
    mode: PaymentMode;
    cycle?: BillingCycle;
  } | null>(null);

  const { data: session, isPending: isSessionLoading } = useSession();
  const router = useRouter();
  const SubscriptionLabel = PAYMENT_MODE_COPY.get("subscription").Label;
  const OneTimeLabel = PAYMENT_MODE_COPY.get("one_time").Label;
  const MonthlyLabel = BILLING_CYCLE_COPY.get("monthly").Label;
  const YearlyLabel = BILLING_CYCLE_COPY.get("yearly").Label;
  const DiscountLabel = TIER_UI_COPY.get("discount").Label;
  const RecommendedLabel = TIER_UI_COPY.get("recommended").Label;
  const OneTimeBillingLabel = TIER_UI_COPY.get("oneTime").Label;
  const AnnualBillingLabel = TIER_UI_COPY.get("annually").Label;
  const MonthlyBillingLabel = TIER_UI_COPY.get("monthly").Label;
  const ProcessingLabel = TIER_UI_COPY.get("processing").Label;
  const LoginToBuyLabel = TIER_UI_COPY.get("loginToBuy").Label;
  const LoginActionLabel = TIER_UI_COPY.get("loginAction").Label;
  const ManagePlanActionLabel = TIER_UI_COPY.get("managePlanAction").Label;

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
      toast.error(<>Please log in to continue purchase.</>, {
        action: {
          label: <LoginActionLabel />,
          onClick: () => router.push("/login?redirect=/pricing"),
        },
      });
      router.push("/login?redirect=/pricing");
      return;
    }

    setLoadingState({ tierId: tier.id, mode, cycle });
    toast.info(<>Initializing secure checkout sequence...</>);

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
        const safeManagementUrl = getSafeBillingRedirectUrl(
          data.managementUrl,
          window.location,
        );
        toast.error(data.error || "Subscription already active.", {
          description: undefined,
          ...(safeManagementUrl
            ? {
                action: {
                  label: <ManagePlanActionLabel />,
                  onClick: () => {
                    window.location.href = safeManagementUrl;
                  },
                },
              }
            : {}),
        });
        if (data.managementUrl && !safeManagementUrl) {
          console.warn("Blocked unsafe managementUrl redirect.");
        }
        return;
      }

      const safeCheckoutUrl = getSafeBillingRedirectUrl(
        data.checkoutUrl,
        window.location,
      );
      if (response.ok && safeCheckoutUrl) {
        isRedirecting = true;
        window.location.href = safeCheckoutUrl;
      } else {
        if (response.ok && data.checkoutUrl && !safeCheckoutUrl) {
          throw new Error("Received an unsafe checkout URL.");
        }
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
              <Calendar className="h-4 w-4" /> <SubscriptionLabel />
            </TabsTrigger>
            <TabsTrigger
              value="one_time"
              className="data-[state=active]:bg-background flex items-center gap-2 text-sm font-medium transition-all data-[state=active]:shadow-sm"
            >
              <CreditCard className="h-4 w-4" /> <OneTimeLabel />
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
              <MonthlyLabel />
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
              <YearlyLabel />
            </Label>
          </div>
          <div className="flex h-7 items-center justify-center">
            {billingCycle === "yearly" && (
              <Badge
                variant="outline"
                className="animate-in fade-in-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 duration-300 dark:text-emerald-400"
              >
                <Zap className="mr-1.5 h-3 w-3" /> <DiscountLabel />
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
        {PRODUCT_TIERS.map((tier) => {
          const TierDescription = PRICING_TIER_COPY.get(tier.id).Description;
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
                    <RecommendedLabel />
                  </Badge>
                </div>
              )}

              <CardHeader className="pt-8 pb-6 text-center">
                <CardTitle className="text-foreground mb-2 text-xl font-bold">
                  {tier.name}
                </CardTitle>
                <CardDescription className="text-muted-foreground mx-auto max-w-[200px] text-sm leading-relaxed">
                  <TierDescription />
                </CardDescription>
                <div className="mt-6 space-y-2">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-foreground font-mono text-4xl font-bold tracking-tight">
                      {paymentMode === "one_time"
                        ? formatPrice(price, intlLocale, tier.currency)
                        : billingCycle === "monthly"
                          ? formatPrice(price, intlLocale, tier.currency)
                          : formatPrice(
                              Math.round(price / 12),
                              intlLocale,
                              tier.currency,
                            )}
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
                        <OneTimeBillingLabel />
                      ) : billingCycle === "yearly" ? (
                        <AnnualBillingLabel />
                      ) : (
                        <MonthlyBillingLabel />
                      )}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col px-6 pt-0 pb-8">
                <div className="bg-muted/30 mb-6 h-px w-full" />
                <div className="mb-8 flex-1 space-y-4">
                  {tier.features.map((feature, index) => {
                    const TierFeatureLabel =
                      PRICING_FEATURE_COPY.get(feature.id).Label;

                    return (
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
                          <TierFeatureLabel />
                        </span>
                      </div>
                    );
                  })}
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
                        <ProcessingLabel />
                      </>
                    ) : !session?.user ? (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        <LoginToBuyLabel />
                      </>
                    ) : (
                      <>
                        <TierActionGetLabel tierName={tier.name} />
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
