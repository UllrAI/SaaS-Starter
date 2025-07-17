"use client";

import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useEffect, useState } from "react";

type PaymentStatus = "success" | "failed" | "pending" | "cancelled";

interface StatusConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  badgeVariant: "default" | "destructive" | "secondary" | "outline";
  badgeText: string;
  primaryAction: {
    text: string;
    href: string;
    variant: "default" | "destructive" | "outline" | "secondary";
  };
  secondaryAction?: {
    text: string;
    href: string;
  };
}

const statusConfigs: Record<PaymentStatus, StatusConfig> = {
  success: {
    icon: <CheckCircle className="h-20 w-20 text-emerald-500" />,
    title: "Payment Successful!",
    description:
      "Thank you for your purchase! Your subscription has been activated and you now have access to all premium features.",
    badgeVariant: "default",
    badgeText: "Payment Completed",
    primaryAction: {
      text: "Access Dashboard",
      href: "/dashboard",
      variant: "default",
    },
    secondaryAction: {
      text: "Manage Billing",
      href: "/dashboard/settings?page=billing",
    },
  },
  failed: {
    icon: <XCircle className="h-20 w-20 text-red-500" />,
    title: "Payment Failed",
    description:
      "We couldn't process your payment. Please check your payment method and try again, or contact our support team for assistance.",
    badgeVariant: "destructive",
    badgeText: "Payment Failed",
    primaryAction: {
      text: "Try Again",
      href: "/pricing",
      variant: "default",
    },
    secondaryAction: {
      text: "Contact Support",
      href: "/contact",
    },
  },
  pending: {
    icon: <Clock className="h-20 w-20 text-amber-500" />,
    title: "Payment Processing",
    description:
      "Your payment is being processed. This may take a few minutes. The page will automatically refresh to show the latest status.",
    badgeVariant: "secondary",
    badgeText: "Processing",
    primaryAction: {
      text: "Go to Dashboard",
      href: "/dashboard",
      variant: "outline",
    },
    secondaryAction: {
      text: "Check Status",
      href: "/dashboard/settings?page=billing",
    },
  },
  cancelled: {
    icon: <AlertCircle className="h-20 w-20 text-slate-500" />,
    title: "Payment Cancelled",
    description:
      "You cancelled the payment process. No charges have been made to your account. You can try again anytime.",
    badgeVariant: "outline",
    badgeText: "Cancelled",
    primaryAction: {
      text: "View Plans",
      href: "/pricing",
      variant: "default",
    },
    secondaryAction: {
      text: "Go to Dashboard",
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

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const statusParam = searchParams.get("status") as PaymentStatus;
        const sessionIdParam =
          searchParams.get("session_id") || searchParams.get("checkout_id");

        setSessionId(sessionIdParam);

        // If we have a clear status from URL and it's success or failed, use it directly
        if (
          statusParam &&
          statusParam in statusConfigs &&
          (statusParam === "success" || statusParam === "failed")
        ) {
          setStatus(statusParam);
          setIsLoading(false);
          return;
        }

        // For pending, cancelled, or no status, check with the API
        const paramName = sessionIdParam?.startsWith("ch_")
          ? "checkout_id"
          : "sessionId";
        const response = await fetch(
          `/api/payment-status?${sessionIdParam ? `${paramName}=${sessionIdParam}` : ""}`,
        );
        if (response.ok) {
          const data = await response.json();
          setStatus(data.status as PaymentStatus);

          // Only set up auto-refresh for pending status
          if (data.status === "pending" && sessionIdParam) {
            setTimeout(() => {
              checkPaymentStatus();
            }, 5000); // Check again in 5 seconds
          }
        } else {
          // Fallback to URL parameter or default to pending
          setStatus(
            statusParam && statusParam in statusConfigs
              ? statusParam
              : "pending",
          );
        }
      } catch (err) {
        console.error("Error checking payment status:", err);
        setError("Failed to check payment status");
        // Fallback to URL parameter or default to pending
        const statusParam = searchParams.get("status") as PaymentStatus;
        setStatus(
          statusParam && statusParam in statusConfigs ? statusParam : "pending",
        );
      } finally {
        setIsLoading(false);
      }
    };

    checkPaymentStatus();
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

        <div className="relative mx-auto max-w-md px-6">
          <Card className="text-center">
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
        </div>
      </section>
    );
  }

  const config = statusConfigs[status];

  return (
    <section className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.03),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      </div>

      <div className="relative mx-auto max-w-2xl px-6">
        {/* Status Badge */}
        <div className="mb-8 text-center">
          <Badge variant={config.badgeVariant} className="">
            {status === "success" && <Sparkles className="h-3 w-3" />}
            {status === "failed" && <AlertCircle className="h-3 w-3" />}
            {status === "pending" && <Clock className="h-3 w-3" />}
            {status === "cancelled" && <XCircle className="h-3 w-3" />}
            {config.badgeText}
          </Badge>
        </div>

        {/* Main Content Card */}
        <Card className="text-center">
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
              {config.title}
            </h1>

            {/* Description */}
            <p className="text-muted-foreground mx-auto mb-8 max-w-lg text-lg leading-relaxed">
              {config.description}
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
                  {config.primaryAction.text}
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
                    {config.secondaryAction.text}
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
