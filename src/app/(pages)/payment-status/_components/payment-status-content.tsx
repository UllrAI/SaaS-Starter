"use client";

import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CompactContainer } from "@/components/layout/page-container";
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Home,
  CreditCard,
  Mail,
  Settings,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type PaymentStatus = "success" | "failed" | "pending" | "cancelled";

const DIRECT_STATUS_MAP: Record<
  Exclude<PaymentStatus, "success">,
  PaymentStatus
> = {
  failed: "failed",
  pending: "pending",
  cancelled: "cancelled",
};

interface StatusConfig {
  icon: React.ReactNode;
  Title: React.ComponentType;
  Description: React.ComponentType;
  badgeVariant: "default" | "destructive" | "secondary" | "outline";
  BadgeText: React.ComponentType;
  primaryAction: {
    Text: React.ComponentType;
    href: string;
    variant: "default" | "destructive" | "outline" | "secondary";
  };
  secondaryAction?: {
    Text: React.ComponentType;
    href: string;
  };
}

const statusConfigs: Record<PaymentStatus, StatusConfig> = {
  success: {
    icon: <CheckCircle className="h-20 w-20 text-emerald-500" />,
    Title: function PaymentStatusTitleSuccess() {
      return <>Payment Successful!</>;
    },
    Description: function PaymentStatusDescriptionSuccess() {
      return (
        <>
          Thank you for your purchase! Your subscription has been activated and
          you now have access to all premium features.
        </>
      );
    },
    badgeVariant: "default",
    BadgeText: function PaymentStatusBadgeSuccess() {
      return <>Payment Completed</>;
    },
    primaryAction: {
      Text: function PaymentStatusPrimarySuccess() {
        return <>Access Dashboard</>;
      },
      href: "/dashboard",
      variant: "default",
    },
    secondaryAction: {
      Text: function PaymentStatusSecondarySuccess() {
        return <>Manage Billing</>;
      },
      href: "/dashboard/billing",
    },
  },
  failed: {
    icon: <XCircle className="h-20 w-20 text-red-500" />,
    Title: function PaymentStatusTitleFailed() {
      return <>Payment Failed</>;
    },
    Description: function PaymentStatusDescriptionFailed() {
      return (
        <>
          We couldn&apos;t process your payment. Please check your payment
          method and try again, or contact our support team for assistance.
        </>
      );
    },
    badgeVariant: "destructive",
    BadgeText: function PaymentStatusBadgeFailed() {
      return <>Payment Failed</>;
    },
    primaryAction: {
      Text: function PaymentStatusPrimaryFailed() {
        return <>Try Again</>;
      },
      href: "/pricing",
      variant: "default",
    },
    secondaryAction: {
      Text: function PaymentStatusSecondaryFailed() {
        return <>Contact Support</>;
      },
      href: "/contact",
    },
  },
  pending: {
    icon: <Clock className="h-20 w-20 text-amber-500" />,
    Title: function PaymentStatusTitlePending() {
      return <>Payment Processing</>;
    },
    Description: function PaymentStatusDescriptionPending() {
      return (
        <>
          Your payment is being processed. This may take a few minutes. The page
          will automatically refresh to show the latest status.
        </>
      );
    },
    badgeVariant: "secondary",
    BadgeText: function PaymentStatusBadgePending() {
      return <>Processing</>;
    },
    primaryAction: {
      Text: function PaymentStatusPrimaryPending() {
        return <>Go to Dashboard</>;
      },
      href: "/dashboard",
      variant: "outline",
    },
    secondaryAction: {
      Text: function PaymentStatusSecondaryPending() {
        return <>Check Status</>;
      },
      href: "/dashboard/billing",
    },
  },
  cancelled: {
    icon: <AlertCircle className="h-20 w-20 text-slate-500" />,
    Title: function PaymentStatusTitleCancelled() {
      return <>Payment Cancelled</>;
    },
    Description: function PaymentStatusDescriptionCancelled() {
      return (
        <>
          You cancelled the payment process. No charges have been made to your
          account. You can try again anytime.
        </>
      );
    },
    badgeVariant: "outline",
    BadgeText: function PaymentStatusBadgeCancelled() {
      return <>Cancelled</>;
    },
    primaryAction: {
      Text: function PaymentStatusPrimaryCancelled() {
        return <>View Plans</>;
      },
      href: "/pricing",
      variant: "default",
    },
    secondaryAction: {
      Text: function PaymentStatusSecondaryCancelled() {
        return <>Go to Dashboard</>;
      },
      href: "/dashboard",
    },
  },
};

export function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isActive = true;
    const abortController = new AbortController();

    const clearPollTimeout = () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };

    const checkPaymentStatus = async () => {
      try {
        const statusParam = searchParams.get("status") as PaymentStatus;
        const checkoutIdParam =
          searchParams.get("session_id") || searchParams.get("checkout_id");

        setSessionId(checkoutIdParam);

        if (checkoutIdParam) {
          const response = await fetch(
            `/api/payment-status?checkout_id=${encodeURIComponent(checkoutIdParam)}`,
            { signal: abortController.signal },
          );

          if (response.ok) {
            const data = await response.json();
            if (!isActive) return;

            setStatus(data.status as PaymentStatus);
            setError(null);

            if (data.status === "pending") {
              clearPollTimeout();
              pollTimeoutRef.current = setTimeout(() => {
                void checkPaymentStatus();
              }, 5000);
            }
            return;
          }
        }

        if (statusParam && statusParam in DIRECT_STATUS_MAP) {
          setStatus(
            DIRECT_STATUS_MAP[statusParam as keyof typeof DIRECT_STATUS_MAP],
          );
          setError(null);
          setIsLoading(false);
          return;
        }

        if (statusParam === "success") {
          setStatus("pending");
          setError(
            "We are still verifying this payment because the checkout reference is missing.",
          );
          setIsLoading(false);
          return;
        }

        setStatus("pending");
        setError(null);
      } catch (err) {
        if (!isActive) return;
        if (err instanceof DOMException && err.name === "AbortError") return;

        console.error("Error checking payment status:", err);
        setError("Failed to check payment status");
        const statusParam = searchParams.get("status") as PaymentStatus;
        setStatus(
          statusParam && statusParam in DIRECT_STATUS_MAP
            ? DIRECT_STATUS_MAP[statusParam as keyof typeof DIRECT_STATUS_MAP]
            : "pending",
        );
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void checkPaymentStatus();

    return () => {
      isActive = false;
      abortController.abort();
      clearPollTimeout();
    };
  }, [searchParams]); // Re-run when search params change

  // Show loading state while checking status
  if (isLoading || status === null) {
    return (
      <section className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.03),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
        </div>

        <CompactContainer className="relative">
          <Card className="w-full text-center">
            <CardContent className="pt-6">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <Loader2 className="text-primary h-16 w-16 animate-spin" />
                  <div className="bg-primary/10 absolute inset-0 animate-pulse rounded-full" />
                </div>
              </div>

              <div className="mb-4 flex justify-center">
                <Badge variant="secondary" className="gap-2">
                  <Clock className="h-3 w-3" />
                  Verifying Payment
                </Badge>
              </div>

              <h1 className="mb-3 text-xl font-semibold">
                Checking Payment Status
              </h1>

              <p className="text-muted-foreground text-sm leading-relaxed">
                Please wait while we confirm your payment...
              </p>
            </CardContent>
          </Card>
        </CompactContainer>
      </section>
    );
  }

  const config = statusConfigs[status];
  const Title = config.Title;
  const Description = config.Description;
  const BadgeText = config.BadgeText;
  const PrimaryActionText = config.primaryAction.Text;
  const SecondaryActionText = config.secondaryAction?.Text;

  return (
    <section className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.03),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      </div>

      <CompactContainer className="relative">
        {/* Status Badge */}
        <div className="mb-8 text-center">
          <Badge variant={config.badgeVariant} className="">
            {status === "success" && <Sparkles className="h-3 w-3" />}
            {status === "failed" && <AlertCircle className="h-3 w-3" />}
            {status === "pending" && <Clock className="h-3 w-3" />}
            {status === "cancelled" && <XCircle className="h-3 w-3" />}
            <BadgeText />
          </Badge>
        </div>

        {/* Main Content Card */}
        <Card className="w-full text-center">
          <CardContent className="pt-8">
            {/* Icon with animation */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                {config.icon}
                {status === "success" && (
                  <div className="absolute -inset-2 rounded-full" />
                )}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              <Title />
            </h1>

            {/* Description */}
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
              <Description />
            </p>

            {/* Session ID */}
            {sessionId && (
              <Alert className="mb-8">
                <CreditCard className="h-4 w-4" />
                <AlertDescription>
                  <span className="text-muted-foreground text-sm">
                    Transaction ID:{" "}
                    <code className="bg-muted rounded px-2 py-1 font-mono text-xs">
                      {sessionId}
                    </code>
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="space-x-3">
              <Button
                asChild
                variant={config.primaryAction.variant}
                size="lg"
                className="w-full min-w-[200px] sm:w-auto"
              >
                <Link
                  href={config.primaryAction.href}
                  className="flex items-center justify-center gap-2"
                >
                  {status === "success" && <Home className="h-4 w-4" />}
                  {status === "failed" && <ArrowRight className="h-4 w-4" />}
                  {status === "pending" && <Home className="h-4 w-4" />}
                  {status === "cancelled" && <ArrowRight className="h-4 w-4" />}
                  <PrimaryActionText />
                </Link>
              </Button>

              {config.secondaryAction && (
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="w-full min-w-[200px] sm:w-auto"
                >
                  <Link
                    href={config.secondaryAction.href}
                    className="flex items-center justify-center gap-2"
                  >
                    {status === "success" && <Settings className="h-4 w-4" />}
                    {status === "failed" && <Mail className="h-4 w-4" />}
                    {status === "pending" && <CreditCard className="h-4 w-4" />}
                    {status === "cancelled" && <Home className="h-4 w-4" />}
                    {SecondaryActionText ? <SecondaryActionText /> : null}
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </CompactContainer>
    </section>
  );
}
