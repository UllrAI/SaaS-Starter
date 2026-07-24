"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Loader2, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIntlLocale } from "@/hooks/use-intl-locale";
import { getSafeBillingRedirectUrl } from "@/lib/billing/url";
import {
  canManageSubscription,
  resolveBillingAccess,
} from "@/lib/billing/access";
import { formatCurrency } from "@/lib/utils";
import type {
  PaymentRecord,
  ProductEntitlement,
  Subscription,
} from "@/types/billing";
import { LocalizedLink } from "@/components/localized-link";
interface BillingOverviewProps {
  subscription: Subscription | null;
  entitlement: ProductEntitlement | null;
  payments: PaymentRecord[];
}
function RedirectingToSubscriptionManagementToast() {
  const { t } = useTranslation();
  return <>{t("747a00e98aeb", "Redirecting to subscription management...")}</>;
}
function BillingPortalErrorToast() {
  const { t } = useTranslation();
  return (
    <>
      {t(
        "billing_portal_error",
        "We could not open billing management. Please try again.",
      )}
    </>
  );
}
function NoActiveSubscriptionLabel() {
  const { t } = useTranslation();
  return <>{t("596a916936d4", "No active subscription")}</>;
}
function NotScheduledLabel() {
  const { t } = useTranslation();
  return <>{t("fc0eb782d580", "Not scheduled")}</>;
}
function LatestPaymentDateLabel({ date }: { date: string }) {
  const { t } = useTranslation();
  return (
    <>
      {t("c2bd30cfc54c", "Latest: {date}", {
        date,
      })}
    </>
  );
}
function NoPaymentRecordsLabel() {
  const { t } = useTranslation();
  return <>{t("fe7244137ccf", "No records yet")}</>;
}
function SubscriptionStatusLabel({ status }: { status: string }) {
  const { t } = useTranslation();
  switch (status) {
    case "active":
      return <>{t("billing_status_active", "Active")}</>;
    case "trialing":
      return <>{t("billing_status_trialing", "Trialing")}</>;
    case "scheduled_cancel":
      return <>{t("billing_status_scheduled_cancel", "Scheduled to cancel")}</>;
    case "canceled":
      return <>{t("billing_status_canceled", "Canceled")}</>;
    default:
      return <>{t("billing_status_inactive", "Inactive")}</>;
  }
}
function PaymentTypeLabel({ type }: { type: string }) {
  const { t } = useTranslation();
  return type === "one_time" ? (
    <>{t("billing_payment_type_one_time", "One-time purchase")}</>
  ) : (
    <>{t("billing_payment_type_subscription", "Subscription")}</>
  );
}
function PaymentStatusLabel({ status }: { status: string }) {
  const { t } = useTranslation();
  switch (status) {
    case "succeeded":
      return <>{t("billing_payment_status_succeeded", "Succeeded")}</>;
    case "pending":
      return <>{t("billing_payment_status_pending", "Pending")}</>;
    case "partially_refunded":
      return (
        <>
          {t("billing_payment_status_partially_refunded", "Partially refunded")}
        </>
      );
    case "refunded":
      return <>{t("billing_payment_status_refunded", "Refunded")}</>;
    case "disputed":
      return <>{t("billing_payment_status_disputed", "Disputed")}</>;
    case "failed":
      return <>{t("billing_payment_status_failed", "Failed")}</>;
    default:
      return <>{t("billing_payment_status_unknown", "Unknown")}</>;
  }
}
export function BillingOverview({
  subscription,
  entitlement,
  payments,
}: BillingOverviewProps) {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const billingAccess = resolveBillingAccess(subscription, entitlement);
  const currentSubscription =
    billingAccess.kind === "subscription" ? billingAccess.subscription : null;
  const hasLifetimeAccess = billingAccess.kind === "lifetime";
  const canManage = canManageSubscription(subscription);
  const paymentSummary = useMemo(() => {
    const successfulPayments = payments.filter(
      (payment) => payment.status === "succeeded",
    );
    return {
      count: successfulPayments.length,
      latestDate: successfulPayments[0]?.createdAt ?? null,
    };
  }, [payments]);
  const nextBillingDate = currentSubscription?.currentPeriodEnd
    ? new Date(currentSubscription.currentPeriodEnd).toLocaleDateString(
        intlLocale,
      )
    : null;
  const currentTierId =
    billingAccess.kind === "subscription"
      ? billingAccess.subscription.tierId
      : billingAccess.kind === "lifetime"
        ? billingAccess.entitlement.productId
        : null;
  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    toast.info(<RedirectingToSubscriptionManagementToast />);
    try {
      const response = await fetch("/api/billing/portal");
      const data = await response.json();
      const safePortalUrl = getSafeBillingRedirectUrl(
        data.portalUrl,
        window.location,
      );
      if (!response.ok || !safePortalUrl) {
        throw new Error("Billing portal request failed.");
      }
      window.location.assign(safePortalUrl);
    } catch (error) {
      console.error("Unable to open billing portal:", error);
      toast.error(<BillingPortalErrorToast />);
    } finally {
      setIsPortalLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>
              {t("ba99902b6481", "Current Plan")}
            </CardDescription>
            <CardTitle className="text-base">
              {currentTierId ? (
                `${currentTierId.charAt(0).toUpperCase()}${currentTierId.slice(1)}`
              ) : (
                <>{t("d4b2857ce5d2", "Free")}</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm">
            {/* <CreditCard className="text-muted-foreground h-4 w-4" /> */}
            {currentSubscription ? (
              <Badge
                className="capitalize"
                variant={
                  ["active", "trialing"].includes(currentSubscription.status)
                    ? "default"
                    : "secondary"
                }
              >
                <SubscriptionStatusLabel status={currentSubscription.status} />
              </Badge>
            ) : hasLifetimeAccess ? (
              <Badge variant="default">
                {t("billing_lifetime_access", "Lifetime access")}
              </Badge>
            ) : (
              <span className="text-muted-foreground">
                <NoActiveSubscriptionLabel />
              </span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>
              {hasLifetimeAccess
                ? t("billing_access_term", "Access Term")
                : t("b620b54bfdec", "Next Billing Date")}
            </CardDescription>
            <CardTitle className="text-base">
              {hasLifetimeAccess
                ? t("billing_lifetime", "Lifetime")
                : nextBillingDate || <NotScheduledLabel />}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground flex items-center gap-2 text-sm">
            <CalendarClock className="h-4 w-4" />
            {hasLifetimeAccess ? (
              <>
                {t(
                  "billing_no_renewal",
                  "One-time purchase; no renewal is required.",
                )}
              </>
            ) : currentSubscription?.canceledAt ? (
              <>{t("141680a4d3e7", "Subscription ends at period close")}</>
            ) : (
              <>{t("393e806b8041", "Based on your current billing cycle")}</>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>
              {t("7534811de973", "Successful Payments")}
            </CardDescription>
            <CardTitle className="text-base">{paymentSummary.count}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground flex items-center gap-2 text-sm">
            <ReceiptText className="h-4 w-4" />
            {paymentSummary.latestDate ? (
              <LatestPaymentDateLabel
                date={new Date(paymentSummary.latestDate).toLocaleDateString(
                  intlLocale,
                )}
              />
            ) : (
              <NoPaymentRecordsLabel />
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("5912dc0d4006", "Subscription Management")}</CardTitle>
          <CardDescription>
            {t(
              "45011971a8f8",
              "Use the billing portal to update your payment method, invoices, and subscription status.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {canManage ? (
            <Button
              onClick={handleManageSubscription}
              disabled={isPortalLoading}
            >
              {t("f3d6ee9e6c3e", "{expression0} Manage Subscription", {
                expression0: isPortalLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ),
              })}
            </Button>
          ) : (
            <Button asChild>
              <LocalizedLink href="/pricing">
                {t("dd7d10cbc338", "View Plans")}
              </LocalizedLink>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("31a6950109ab", "Payment History")}</CardTitle>
          <CardDescription>
            {t(
              "9e52dd2f01df",
              "Review your recent subscription and one-time payment records.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("7f2bf0739bb0", "Date")}</TableHead>
                  <TableHead>{t("b02f3639bc71", "Product")}</TableHead>
                  <TableHead>{t("740b64b79003", "Type")}</TableHead>
                  <TableHead>{t("baf1b8816ca2", "Amount")}</TableHead>
                  <TableHead>{t("383b7246808d", "Status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">
                      {new Date(payment.createdAt).toLocaleDateString(
                        intlLocale,
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {payment.tierName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.paymentType === "one_time"
                            ? "secondary"
                            : "default"
                        }
                      >
                        <PaymentTypeLabel type={payment.paymentType} />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        payment.amount,
                        payment.currency,
                        intlLocale,
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className="capitalize"
                        variant={
                          payment.status === "succeeded"
                            ? "default"
                            : "destructive"
                        }
                      >
                        <PaymentStatusLabel status={payment.status} />
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">
              {t("294bb5d0dca3", "No payment history found.")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
