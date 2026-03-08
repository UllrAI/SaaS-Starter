"use client";

import { type ReactNode, useEffect, useState } from "react";
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
  Calendar,
  Check,
  CreditCard,
  Loader2,
  LogIn,
  Terminal,
  Zap,
} from "lucide-react";
import { PRODUCT_TIERS, type PricingTier } from "@/lib/config/products";
import { useSession } from "@/lib/auth/client";
import { useRouter } from "nextjs-toploader/app";
import type { BillingCycle, PaymentMode } from "@/types/billing";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { useIntlLocale } from "@/hooks/use-intl-locale";
import { getSafeBillingRedirectUrl } from "@/lib/billing/url";

type CheckoutMessageCode =
  | "checkout_failed"
  | "initializing_checkout"
  | "invalid_request"
  | "login_required"
  | "subscription_active"
  | "unexpected_checkout_error"
  | "unsafe_checkout_url";

type CheckoutResponse = {
  checkoutUrl?: string;
  code?: string;
  managementUrl?: string;
};

function formatPrice(price: number, locale: string, currency = "USD") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(price);
}

function PaymentModeLabel({ mode }: { mode: PaymentMode }) {
  return mode === "subscription" ? <>Subscription</> : <>One-Time</>;
}

function BillingCycleLabel({ cycle }: { cycle: BillingCycle }) {
  return cycle === "monthly" ? <>Monthly</> : <>Yearly</>;
}

function TierBillingLabel({
  billingCycle,
  paymentMode,
}: {
  billingCycle: BillingCycle;
  paymentMode: PaymentMode;
}) {
  if (paymentMode === "one_time") {
    return <>One-time purchase, no automatic renewal</>;
  }

  return billingCycle === "yearly" ? <>Billed annually</> : <>Billed monthly</>;
}

function CheckoutMessage({ code }: { code: CheckoutMessageCode }) {
  switch (code) {
    case "checkout_failed":
      return <>Failed to create checkout session. Please try again later.</>;
    case "initializing_checkout":
      return <>Initializing secure checkout sequence...</>;
    case "invalid_request":
      return <>Unable to start checkout with the current selection.</>;
    case "login_required":
      return <>Please log in to continue purchase.</>;
    case "subscription_active":
      return <>Subscription already active.</>;
    case "unsafe_checkout_url":
      return <>The checkout link was blocked because it looked unsafe.</>;
    case "unexpected_checkout_error":
      return <>An unexpected error occurred.</>;
    default:
      return null;
  }
}

function TierActionGetLabel({ tierName }: { tierName: string }) {
  return <>GET {tierName.toUpperCase()}</>;
}

function isCheckoutMessageCode(
  value: string | undefined,
): value is CheckoutMessageCode {
  return (
    value === "checkout_failed" ||
    value === "initializing_checkout" ||
    value === "invalid_request" ||
    value === "login_required" ||
    value === "subscription_active" ||
    value === "unexpected_checkout_error" ||
    value === "unsafe_checkout_url"
  );
}

function resolveCheckoutMessageCode(
  status: number,
  code: string | undefined,
): CheckoutMessageCode {
  if (isCheckoutMessageCode(code)) {
    return code;
  }

  switch (status) {
    case 400:
      return "invalid_request";
    case 401:
      return "login_required";
    case 409:
      return "subscription_active";
    default:
      return "checkout_failed";
  }
}

export function PricingSection({ className }: { className?: string }) {
  const intlLocale = useIntlLocale();
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("subscription");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [loadingState, setLoadingState] = useState<{
    cycle?: BillingCycle;
    mode: PaymentMode;
    tierId: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  const { data: session, isPending: isSessionLoading } = useSession();
  const router = useRouter();
  const featureDefinitions = [
    {
      id: "marketing-foundation",
      label: <>Marketing pages and blog foundation</>,
    },
    {
      id: "auth-dashboard",
      label: <>Authentication and protected dashboard</>,
    },
    {
      id: "billing-flow",
      label: <>Creem checkout and billing portal flow</>,
    },
    {
      id: "admin-operations",
      label: <>Admin operations screens</>,
    },
    {
      id: "r2-uploads",
      label: <>Cloudflare R2 upload workflows</>,
    },
    {
      id: "localization-setup",
      label: <>Localization setup</>,
    },
    {
      id: "implementation-guidance",
      label: <>Implementation guidance</>,
    },
  ] as const satisfies ReadonlyArray<{
    id: string;
    label: ReactNode;
  }>;
  type FeatureId = (typeof featureDefinitions)[number]["id"];
  const allFeatureIds = featureDefinitions.map((feature) => feature.id) as Array<
    FeatureId
  >;
  const tierCopyById: Record<
    string,
    {
      description: ReactNode;
      includedFeatureIds: readonly FeatureId[];
    }
  > = {
    plus: {
      description: <>Core starter package for solo builders shipping the basics</>,
      includedFeatureIds: [
        "marketing-foundation",
        "auth-dashboard",
        "billing-flow",
      ],
    },
    pro: {
      description: <>Full-featured starter package for teams shipping a real MVP</>,
      includedFeatureIds: [
        "marketing-foundation",
        "auth-dashboard",
        "billing-flow",
        "admin-operations",
        "r2-uploads",
        "localization-setup",
      ],
    },
    team: {
      description: <>Everything in Professional plus rollout support for teams</>,
      includedFeatureIds: allFeatureIds,
    },
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const redirectToLogin = () => {
    router.push("/login?redirect=/pricing");
  };

  const handleCheckout = async (
    tier: PricingTier,
    mode: PaymentMode,
    cycle?: BillingCycle,
  ) => {
    if (!session?.user) {
      toast.error(<CheckoutMessage code="login_required" />, {
        action: {
          label: <>Login</>,
          onClick: redirectToLogin,
        },
      });
      redirectToLogin();
      return;
    }

    setLoadingState({ tierId: tier.id, mode, cycle });
    toast.info(<CheckoutMessage code="initializing_checkout" />);

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

      const data = (await response.json()) as CheckoutResponse;

      if (response.status === 409) {
        const safeManagementUrl = getSafeBillingRedirectUrl(
          data.managementUrl,
          window.location,
        );

        toast.error(
          <CheckoutMessage
            code={resolveCheckoutMessageCode(response.status, data.code)}
          />,
          {
            description: undefined,
            ...(safeManagementUrl
              ? {
                  action: {
                    label: <>Manage Plan</>,
                    onClick: () => {
                      window.location.href = safeManagementUrl;
                    },
                  },
                }
              : {}),
          },
        );

        if (data.managementUrl && !safeManagementUrl) {
          console.warn("Blocked unsafe managementUrl redirect.");
        }

        return;
      }

      if (response.status === 401) {
        toast.error(<CheckoutMessage code="login_required" />, {
          action: {
            label: <>Login</>,
            onClick: redirectToLogin,
          },
        });
        redirectToLogin();
        return;
      }

      const safeCheckoutUrl = getSafeBillingRedirectUrl(
        data.checkoutUrl,
        window.location,
      );

      if (response.ok && safeCheckoutUrl) {
        isRedirecting = true;
        window.location.href = safeCheckoutUrl;
        return;
      }

      if (response.ok && data.checkoutUrl && !safeCheckoutUrl) {
        throw new Error("unsafe_checkout_url");
      }

      throw new Error(resolveCheckoutMessageCode(response.status, data.code));
    } catch (error) {
      console.error("Checkout Error:", error);

      const code =
        error instanceof Error && isCheckoutMessageCode(error.message)
          ? error.message
          : "unexpected_checkout_error";

      toast.error(<CheckoutMessage code={code} />);
    } finally {
      if (!isRedirecting) {
        setLoadingState(null);
      }
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-8 text-center">
        <Tabs
          value={paymentMode}
          onValueChange={(value) => setPaymentMode(value as PaymentMode)}
          className="mx-auto w-full max-w-sm"
        >
          <TabsList className="bg-muted/50 grid h-11 w-full grid-cols-2 p-1">
            <TabsTrigger
              value="subscription"
              className="data-[state=active]:bg-background flex items-center gap-2 text-sm font-medium transition-all data-[state=active]:shadow-sm"
            >
              <Calendar className="h-4 w-4" />
              <PaymentModeLabel mode="subscription" />
            </TabsTrigger>
            <TabsTrigger
              value="one_time"
              className="data-[state=active]:bg-background flex items-center gap-2 text-sm font-medium transition-all data-[state=active]:shadow-sm"
            >
              <CreditCard className="h-4 w-4" />
              <PaymentModeLabel mode="one_time" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {paymentMode === "subscription" && (
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="bg-muted/30 flex items-center justify-center gap-3 rounded-sm border p-1">
            <Label
              htmlFor="billing-toggle"
              className={cn(
                "cursor-pointer rounded-sm px-4 py-1.5 text-sm font-medium transition-all select-none",
                billingCycle === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <BillingCycleLabel cycle="monthly" />
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
                "cursor-pointer rounded-sm px-4 py-1.5 text-sm font-medium transition-all select-none",
                billingCycle === "yearly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <BillingCycleLabel cycle="yearly" />
            </Label>
          </div>
          <div className="flex h-7 items-center justify-center">
            {billingCycle === "yearly" && (
              <Badge
                variant="outline"
                className="animate-in fade-in-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 duration-300 dark:text-emerald-400"
              >
                <Zap className="mr-1.5 h-3 w-3" />
                <>Save 17%</>
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
        {PRODUCT_TIERS.map((tier) => {
          const tierCopy = tierCopyById[tier.id as keyof typeof tierCopyById];
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
                  ? "border-primary ring-primary/20 shadow-lg ring-1"
                  : "hover:border-primary/50 shadow-sm hover:shadow-md",
              )}
            >
              {tier.isPopular && (
                <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary px-3 py-1 text-xs font-bold shadow-sm">
                    <>RECOMMENDED</>
                  </Badge>
                </div>
              )}

              <CardHeader className="pt-8 pb-6 text-center">
                <CardTitle className="text-foreground mb-2 text-xl font-bold">
                  {tier.name}
                </CardTitle>
                <CardDescription className="text-muted-foreground mx-auto max-w-[200px] text-sm leading-relaxed">
                  {tierCopy.description}
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
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      <TierBillingLabel
                        billingCycle={billingCycle}
                        paymentMode={paymentMode}
                      />
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col px-6 pt-0 pb-8">
                <div className="bg-muted/30 mb-6 h-px w-full" />
                <div className="mb-8 flex-1 space-y-4">
                  {featureDefinitions.map((feature, index) => {
                    const included = tierCopy.includedFeatureIds.includes(
                      feature.id,
                    );

                    return (
                      <div
                        key={index}
                        className="group/feature flex items-start gap-3"
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border transition-colors",
                            included
                              ? "border-primary/50 bg-primary/10 text-primary"
                              : "border-muted bg-muted/50 text-muted-foreground",
                          )}
                        >
                          <Check className="h-3 w-3" />
                        </div>
                        <span
                          className={cn(
                            "text-sm leading-tight transition-colors",
                            included
                              ? "text-foreground"
                              : "text-muted-foreground line-through opacity-70",
                          )}
                        >
                          {feature.label}
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
                        <>PROCESSING</>
                      </>
                    ) : !session?.user ? (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        <>LOGIN TO BUY</>
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
