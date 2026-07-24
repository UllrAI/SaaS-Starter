"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FocusContainer } from "@/components/layout/page-container";
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
import { LocalizedLink } from "@/components/localized-link";
import { type ReactNode, useEffect, useRef, useState } from "react";
type PaymentStatus = "success" | "failed" | "pending" | "cancelled";
type PaymentMode = "subscription" | "one_time";
type PaymentStatusErrorCode =
  | "missing_reference"
  | "status_check_failed"
  | "status_check_timeout";
const MAX_POLL_ATTEMPTS = 8;
const INITIAL_POLL_DELAY_MS = 2000;
const MAX_POLL_DELAY_MS = 15000;
const DIRECT_STATUS_MAP: Record<
  Exclude<PaymentStatus, "success">,
  PaymentStatus
> = {
  failed: "failed",
  pending: "pending",
  cancelled: "cancelled",
};
interface StatusConfig {
  badgeText: ReactNode;
  badgeVariant: "default" | "destructive" | "secondary" | "outline";
  description: ReactNode;
  icon: ReactNode;
  primaryAction: {
    href: string;
    text: ReactNode;
    variant: "default" | "destructive" | "outline" | "secondary";
  };
  secondaryAction?: {
    href: string;
    text: ReactNode;
  };
  title: ReactNode;
}
function getStatusConfig(
  status: PaymentStatus,
  paymentMode: PaymentMode | null,
  t: ReturnType<typeof useTranslation>["t"],
): StatusConfig {
  switch (status) {
    case "success":
      return {
        badgeText: (
          <>{t("payment_status_completed_badge", "Payment completed")}</>
        ),
        badgeVariant: "default",
        description:
          paymentMode === "one_time" ? (
            <>
              {t(
                "payment_status_lifetime_success_description",
                "Your one-time purchase is complete. Lifetime access is now active, with no recurring charge.",
              )}
            </>
          ) : (
            <>
              {t(
                "payment_status_subscription_success_description",
                "Your subscription is active, and your account now includes the purchased features.",
              )}
            </>
          ),
        icon: <CheckCircle className="h-20 w-20 text-emerald-500" />,
        primaryAction: {
          href: "/dashboard",
          text: <>{t("payment_status_access_dashboard", "Access dashboard")}</>,
          variant: "default",
        },
        secondaryAction: {
          href: "/dashboard/billing",
          text: <>{t("payment_status_manage_billing", "View billing")}</>,
        },
        title: <>{t("payment_status_success_title", "Payment successful")}</>,
      };
    case "failed":
      return {
        badgeText: <>{t("payment_status_failed_badge", "Payment failed")}</>,
        badgeVariant: "destructive",
        description: (
          <>
            {t(
              "payment_status_failed_description",
              "We could not process your payment. Check your payment method and try again, or contact support for help.",
            )}
          </>
        ),
        icon: <XCircle className="h-20 w-20 text-red-500" />,
        primaryAction: {
          href: "/pricing",
          text: <>{t("payment_status_try_again", "Try again")}</>,
          variant: "default",
        },
        secondaryAction: {
          href: "/contact",
          text: <>{t("payment_status_contact_support", "Contact support")}</>,
        },
        title: <>{t("payment_status_failed_title", "Payment failed")}</>,
      };
    case "pending":
      return {
        badgeText: <>{t("payment_status_processing_badge", "Processing")}</>,
        badgeVariant: "secondary",
        description: (
          <>
            {t(
              "payment_status_processing_description",
              "Your payment is still processing. This page will update automatically when its status changes.",
            )}
          </>
        ),
        icon: <Clock className="h-20 w-20 text-amber-500" />,
        primaryAction: {
          href: "/dashboard",
          text: <>{t("payment_status_go_dashboard", "Go to dashboard")}</>,
          variant: "outline",
        },
        secondaryAction: {
          href: "/dashboard/billing",
          text: <>{t("payment_status_check_billing", "Check billing")}</>,
        },
        title: (
          <>{t("payment_status_processing_title", "Payment processing")}</>
        ),
      };
    case "cancelled":
      return {
        badgeText: <>{t("payment_status_cancelled_badge", "Cancelled")}</>,
        badgeVariant: "outline",
        description: (
          <>
            {t(
              "payment_status_cancelled_description",
              "You cancelled checkout. No charge was made, and you can try again at any time.",
            )}
          </>
        ),
        icon: <AlertCircle className="h-20 w-20 text-slate-500" />,
        primaryAction: {
          href: "/pricing",
          text: <>{t("payment_status_view_plans", "View plans")}</>,
          variant: "default",
        },
        secondaryAction: {
          href: "/dashboard",
          text: <>{t("payment_status_go_dashboard", "Go to dashboard")}</>,
        },
        title: <>{t("payment_status_cancelled_title", "Payment cancelled")}</>,
      };
  }
}
function PaymentStatusErrorMessage({ code }: { code: PaymentStatusErrorCode }) {
  const { t } = useTranslation();
  switch (code) {
    case "missing_reference":
      return (
        <>
          {t(
            "339aaf4ddc46",
            "We received the checkout return, but the checkout reference is missing. Check your billing page in a few minutes or contact support if access does not update.",
          )}
        </>
      );
    case "status_check_failed":
      return <>{t("0b075846d479", "Failed to check payment status.")}</>;
    case "status_check_timeout":
      return (
        <>
          {t(
            "payment_status_timeout",
            "Payment verification is taking longer than expected. Check your billing page for the latest status.",
          )}
        </>
      );
    default:
      return null;
  }
}
export function PaymentStatusContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<PaymentStatusErrorCode | null>(
    null,
  );
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let isActive = true;
    let pollAttempt = 0;
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
          searchParams.get("checkout_id") || searchParams.get("session_id");
        if (checkoutIdParam) {
          pollAttempt += 1;
          const paymentStatusParams = new URLSearchParams({
            checkout_id: checkoutIdParam,
          });
          if (statusParam) {
            paymentStatusParams.set("status", statusParam);
          }
          const response = await fetch(
            `/api/payment-status?${paymentStatusParams}`,
            {
              signal: abortController.signal,
            },
          );
          if (response.ok) {
            const data = await response.json();
            if (!isActive) return;
            setStatus(data.status as PaymentStatus);
            setPaymentMode(
              data.paymentMode === "subscription" ||
                data.paymentMode === "one_time"
                ? data.paymentMode
                : null,
            );
            setErrorCode(null);
            if (data.status === "pending") {
              if (pollAttempt >= MAX_POLL_ATTEMPTS) {
                setErrorCode("status_check_timeout");
              } else {
                const delay = Math.min(
                  INITIAL_POLL_DELAY_MS * 2 ** (pollAttempt - 1),
                  MAX_POLL_DELAY_MS,
                );
                clearPollTimeout();
                pollTimeoutRef.current = setTimeout(() => {
                  void checkPaymentStatus();
                }, delay);
              }
            }
            return;
          }
          throw new Error(`Payment status request failed: ${response.status}`);
        }
        if (statusParam && statusParam in DIRECT_STATUS_MAP) {
          setStatus(
            DIRECT_STATUS_MAP[statusParam as keyof typeof DIRECT_STATUS_MAP],
          );
          setErrorCode(null);
          setIsLoading(false);
          return;
        }
        if (statusParam === "success") {
          setStatus("pending");
          setErrorCode("missing_reference");
          setIsLoading(false);
          return;
        }
        setStatus("pending");
        setErrorCode(null);
      } catch (err) {
        if (!isActive) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Error checking payment status:", err);
        setErrorCode("status_check_failed");
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

        <FocusContainer className="relative">
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
                  <>{t("95644d062359", "Verifying Payment")}</>
                </Badge>
              </div>

              <h1 className="mb-3 text-xl font-semibold">
                <>{t("5e3803d0e6ec", "Checking Payment Status")}</>
              </h1>

              <p className="text-muted-foreground text-sm leading-relaxed">
                <>
                  {t(
                    "278de7e66247",
                    "Please wait while we confirm your payment...",
                  )}
                </>
              </p>
            </CardContent>
          </Card>
        </FocusContainer>
      </section>
    );
  }
  const config = getStatusConfig(status, paymentMode, t);
  return (
    <section className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.03),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      </div>

      <FocusContainer className="relative">
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
              {config.title}
            </h1>

            {/* Description */}
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
              {config.description}
            </p>

            {/* Error Message */}
            {errorCode && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <PaymentStatusErrorMessage code={errorCode} />
                </AlertDescription>
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
                <LocalizedLink
                  href={config.primaryAction.href}
                  className="flex items-center justify-center gap-2"
                >
                  {status === "success" && <Home className="h-4 w-4" />}
                  {status === "failed" && <ArrowRight className="h-4 w-4" />}
                  {status === "pending" && <Home className="h-4 w-4" />}
                  {status === "cancelled" && <ArrowRight className="h-4 w-4" />}
                  {config.primaryAction.text}
                </LocalizedLink>
              </Button>

              {config.secondaryAction && (
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="w-full min-w-[200px] sm:w-auto"
                >
                  <LocalizedLink
                    href={config.secondaryAction.href}
                    className="flex items-center justify-center gap-2"
                  >
                    {status === "success" && <Settings className="h-4 w-4" />}
                    {status === "failed" && <Mail className="h-4 w-4" />}
                    {status === "pending" && <CreditCard className="h-4 w-4" />}
                    {status === "cancelled" && <Home className="h-4 w-4" />}
                    {config.secondaryAction.text}
                  </LocalizedLink>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </FocusContainer>
    </section>
  );
}
