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
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { trackUmamiEvent } from "@/lib/analytics/umami";
type PaymentStatus = "success" | "failed" | "pending" | "cancelled";
type PaymentMode = "subscription" | "one_time";
type PaymentStatusErrorCode =
  | "missing_reference"
  | "status_check_failed"
  | "status_check_timeout";
const MAX_POLL_ATTEMPTS = 8;
const INITIAL_POLL_DELAY_MS = 2000;
const MAX_POLL_DELAY_MS = 15000;
const REQUEST_TIMEOUT_MS = 10_000;

function parsePaymentStatus(value: unknown): PaymentStatus | null {
  return value === "success" ||
    value === "failed" ||
    value === "pending" ||
    value === "cancelled"
    ? value
    : null;
}

interface PaymentCheck {
  status: PaymentStatus | null;
  paymentMode: PaymentMode | null;
  errorCode: PaymentStatusErrorCode | null;
}

const initialCheck: PaymentCheck = {
  status: null,
  paymentMode: null,
  errorCode: null,
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
        badgeText: <>{t("payment_status_completed_badge")}</>,
        badgeVariant: "default",
        description:
          paymentMode === "one_time" ? (
            <>{t("payment_status_lifetime_success_description")}</>
          ) : (
            <>{t("payment_status_success_description")}</>
          ),
        icon: <CheckCircle className="h-20 w-20 text-emerald-500" />,
        primaryAction: {
          href: "/dashboard",
          text: <>{t("payment_status_access_dashboard")}</>,
          variant: "default",
        },
        secondaryAction: {
          href: "/dashboard/billing",
          text: <>{t("payment_status_manage_billing")}</>,
        },
        title: <>{t("payment_status_success_title")}</>,
      };
    case "failed":
      return {
        badgeText: <>{t("payment_status_failed_badge")}</>,
        badgeVariant: "destructive",
        description: <>{t("payment_status_failed_description")}</>,
        icon: <XCircle className="h-20 w-20 text-red-500" />,
        primaryAction: {
          href: "/pricing",
          text: <>{t("payment_status_try_again")}</>,
          variant: "default",
        },
        secondaryAction: {
          href: "/contact",
          text: <>{t("payment_status_contact_support")}</>,
        },
        title: <>{t("payment_status_failed_title")}</>,
      };
    case "pending":
      return {
        badgeText: <>{t("payment_status_processing_badge")}</>,
        badgeVariant: "secondary",
        description: <>{t("payment_status_processing_description")}</>,
        icon: <Clock className="h-20 w-20 text-amber-500" />,
        primaryAction: {
          href: "/dashboard",
          text: <>{t("payment_status_go_dashboard")}</>,
          variant: "outline",
        },
        secondaryAction: {
          href: "/dashboard/billing",
          text: <>{t("payment_status_check_billing")}</>,
        },
        title: <>{t("payment_status_processing_title")}</>,
      };
    case "cancelled":
      return {
        badgeText: <>{t("payment_status_cancelled_badge")}</>,
        badgeVariant: "outline",
        description: <>{t("payment_status_cancelled_description")}</>,
        icon: <AlertCircle className="h-20 w-20 text-slate-500" />,
        primaryAction: {
          href: "/pricing",
          text: <>{t("payment_status_view_plans")}</>,
          variant: "default",
        },
        secondaryAction: {
          href: "/dashboard",
          text: <>{t("payment_status_go_dashboard")}</>,
        },
        title: <>{t("payment_status_cancelled_title")}</>,
      };
  }
}
function PaymentStatusErrorMessage({ code }: { code: PaymentStatusErrorCode }) {
  const { t } = useTranslation();
  switch (code) {
    case "missing_reference":
      return <>{t("billing_checkout_reference_missing")}</>;
    case "status_check_failed":
      return <>{t("billing_failed_check_payment_status")}</>;
    case "status_check_timeout":
      return <>{t("payment_status_timeout")}</>;
    default:
      return null;
  }
}
export function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const checkoutId =
    (searchParams.get("checkout_id")?.trim() ||
      searchParams.get("session_id")?.trim() ||
      searchParams.get("sessionId")?.trim()) ??
    "";
  const statusHint = parsePaymentStatus(searchParams.get("status"));
  const trackedCheckouts = useRef(new Set<string>());
  const trackSuccess = useCallback((id: string, mode: PaymentMode | null) => {
    if (trackedCheckouts.current.has(id)) return;
    trackedCheckouts.current.add(id);
    trackUmamiEvent("payment_success", { payment_mode: mode ?? "unknown" });
  }, []);

  return (
    <PaymentStatusCheck
      key={JSON.stringify([checkoutId, statusHint])}
      checkoutId={checkoutId}
      statusHint={statusHint}
      trackSuccess={trackSuccess}
    />
  );
}

function PaymentStatusCheck({
  checkoutId,
  statusHint,
  trackSuccess,
}: {
  checkoutId: string;
  statusHint: PaymentStatus | null;
  trackSuccess: (id: string, mode: PaymentMode | null) => void;
}) {
  const { t } = useTranslation();
  const [check, setCheck] = useState(initialCheck);
  const [retry, setRetry] = useState(0);
  const fallbackStatus =
    statusHint === "failed" || statusHint === "cancelled"
      ? statusHint
      : "pending";

  useEffect(() => {
    if (!checkoutId) return;

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const search = new URLSearchParams({ checkout_id: checkoutId });
    if (statusHint) search.set("status", statusHint);

    async function checkStatus(attempt: number) {
      let retryAfterMs = 0;
      let confirmedPending = false;
      try {
        const response = await fetch(`/api/payment-status?${search}`, {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          ]),
        });
        if (controller.signal.aborted) return;

        if (response.ok) {
          const data = (await response.json()) as {
            status?: unknown;
            paymentMode?: unknown;
          } | null;
          if (controller.signal.aborted) return;
          const status = parsePaymentStatus(data?.status);
          if (!status) throw new Error("Invalid payment status response.");
          if (status !== "pending") {
            const mode = data?.paymentMode;
            setCheck({
              status,
              paymentMode:
                mode === "subscription" || mode === "one_time" ? mode : null,
              errorCode: null,
            });
            return;
          }
          confirmedPending = true;
        } else if (
          response.status === 408 ||
          response.status === 429 ||
          response.status >= 500
        ) {
          const retryAfter = Number(response.headers?.get("Retry-After"));
          if (Number.isFinite(retryAfter) && retryAfter > 0)
            retryAfterMs = Math.min(retryAfter * 1000, 60_000);
        } else {
          throw new Error(`Payment status request failed: ${response.status}`);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const transient =
          error instanceof TypeError ||
          (error instanceof DOMException && error.name === "TimeoutError");
        if (!transient) {
          console.error("Error checking payment status:", error);
          setCheck({
            ...initialCheck,
            status: fallbackStatus,
            errorCode: "status_check_failed",
          });
          return;
        }
      }

      if (attempt >= MAX_POLL_ATTEMPTS) {
        setCheck({
          ...initialCheck,
          status: confirmedPending ? "pending" : fallbackStatus,
          errorCode: confirmedPending
            ? "status_check_timeout"
            : "status_check_failed",
        });
        return;
      }

      setCheck({ ...initialCheck, status: "pending" });
      const delay = Math.max(
        retryAfterMs,
        Math.min(INITIAL_POLL_DELAY_MS * 2 ** (attempt - 1), MAX_POLL_DELAY_MS),
      );
      timer = setTimeout(() => void checkStatus(attempt + 1), delay);
    }

    void checkStatus(1);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [checkoutId, fallbackStatus, retry, statusHint]);

  const result: PaymentCheck = checkoutId
    ? check
    : {
        ...initialCheck,
        status: fallbackStatus,
        errorCode:
          statusHint === "success" ? ("missing_reference" as const) : null,
      };
  const { status, paymentMode, errorCode } = result;

  useEffect(() => {
    if (checkoutId && status === "success")
      trackSuccess(checkoutId, paymentMode);
  }, [checkoutId, paymentMode, status, trackSuccess]);

  if (status === null) {
    return (
      <section className="bg-background flex min-h-screen items-center justify-center">
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
                  <>{t("billing_verifying_payment")}</>
                </Badge>
              </div>

              <h1 className="mb-3 text-xl font-semibold">
                <>{t("billing_checking_payment_status")}</>
              </h1>

              <p className="text-muted-foreground text-sm leading-relaxed">
                <>{t("billing_please_wait_while_we_confirm_payment")}</>
              </p>
            </CardContent>
          </Card>
        </FocusContainer>
      </section>
    );
  }
  const config = getStatusConfig(status, paymentMode, t);
  return (
    <section className="bg-background flex min-h-screen items-center justify-center">
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
              {status === "pending" && (errorCode || !checkoutId)
                ? t("payment_status_unverified_description")
                : config.description}
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

            {checkoutId && errorCode && (
              <Button
                type="button"
                variant="outline"
                className="mb-4"
                onClick={() => {
                  setCheck(initialCheck);
                  setRetry((current) => current + 1);
                }}
              >
                {t("payment_status_retry_check")}
              </Button>
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
