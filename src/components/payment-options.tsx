"use client";

import React, { useState, useEffect } from "react"; // 引入 useEffect
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
  Star,
} from "lucide-react";
import { PRODUCT_TIERS, type PricingTier } from "@/lib/config/products";
import { useSession } from "@/lib/auth/client";
import { useRouter } from "nextjs-toploader/app";
import type { PaymentMode, BillingCycle } from "@/types/billing";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton"; // 引入骨架屏

// 辅助函数：格式化价格
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
    toast.info("Preparing your secure checkout...");

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
        toast.error(data.error || "You already have an active subscription.", {
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
      {/* 支付模式选择 */}
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
              <CreditCard className="h-4 w-4" /> One-time
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 订阅模式下的年/月切换 */}
      {paymentMode === "subscription" && (
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="bg-muted/30 flex items-center justify-center gap-3 rounded-full p-1">
            <Label
              htmlFor="billing-toggle"
              className={cn(
                "cursor-pointer rounded-full px-3 py-2 text-sm font-medium transition-all select-none",
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
                "cursor-pointer rounded-full px-3 py-2 text-sm font-medium transition-all select-none",
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
                variant="secondary"
                className="animate-in fade-in-0 border-emerald-200/50 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 shadow-sm duration-300 dark:border-emerald-800/50 dark:from-emerald-950/50 dark:to-green-950/50 dark:text-emerald-300"
              >
                <Zap className="mr-1.5 h-3 w-3" /> Save 17% with yearly billing
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* 定价卡片 */}
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
                "group relative transition-all duration-300 ease-out",
                "hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl",
                "transform-gpu will-change-transform",
                tier.isPopular &&
                  "border-primary/50 ring-primary/20 from-primary/5 via-background to-background bg-gradient-to-br shadow-lg ring-1",
              )}
            >
              {tier.isPopular && (
                <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
                  <div className="from-primary to-primary/80 text-primary-foreground flex items-center gap-1.5 rounded-full bg-gradient-to-r px-4 py-1.5 text-xs font-semibold shadow-lg">
                    <Star className="h-3 w-3 fill-current" />
                    Most Popular
                  </div>
                </div>
              )}
              <CardHeader className="pt-6 pb-6 text-center">
                <CardTitle className="group-hover:text-primary mb-2 text-2xl font-bold transition-colors">
                  {tier.name}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-sm leading-relaxed">
                  {tier.description}
                </CardDescription>
                <div className="mt-6 space-y-2">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-foreground text-5xl font-bold tracking-tight">
                      {paymentMode === "one_time"
                        ? formatPrice(price, tier.currency)
                        : billingCycle === "monthly"
                          ? formatPrice(price, tier.currency)
                          : formatPrice(Math.round(price / 12), tier.currency)}
                    </span>
                    {paymentMode === "subscription" && (
                      <span className="text-muted-foreground text-base font-medium">
                        /month
                      </span>
                    )}
                  </div>
                  <div className="flex h-5 items-center justify-center">
                    <p className="text-muted-foreground text-sm font-medium">
                      {paymentMode === "one_time"
                        ? <>One-time payment</>
                        : billingCycle === "yearly"
                          ? <>Billed annually</>
                          : <>Billed monthly</>}
                    </p>
                  </div>
                  {billingCycle === "yearly" && paymentMode !== "one_time" && (
                    <div className="text-muted-foreground/80 text-xs font-medium">
                      {formatPrice(price, tier.currency)} total per year
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col px-6 pt-0 pb-6">
                <div className="mb-6 flex-1 space-y-4">
                  {tier.features.map((feature, index) => (
                    <div
                      key={index}
                      className="group/feature flex items-start gap-3"
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200",
                          feature.included
                            ? "bg-emerald-100 group-hover/feature:bg-emerald-200 dark:bg-emerald-900/30 dark:group-hover/feature:bg-emerald-900/50"
                            : "bg-gray-100 dark:bg-gray-800",
                        )}
                      >
                        <Check
                          className={cn(
                            "h-3 w-3 transition-all duration-200",
                            feature.included
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground/80",
                          )}
                        />
                      </div>
                      <span
                        className={cn(
                          "text-sm leading-relaxed transition-colors duration-200",
                          feature.included
                            ? "text-foreground group-hover/feature:text-foreground/90"
                            : "text-muted-foreground line-through",
                        )}
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
                {!mounted || isSessionLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <Button
                    className={cn(
                      "h-12 w-full cursor-pointer text-base font-semibold transition-all duration-200",
                      "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
                      "disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none",
                      tier.isPopular &&
                        "bg-primary hover:bg-primary/90 shadow-lg",
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
                        Processing...
                      </>
                    ) : !session?.user ? (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Login to Get {tier.name}
                      </>
                    ) : (
                      `Get ${tier.name}`
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
