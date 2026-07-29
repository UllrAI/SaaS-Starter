"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import React, { useState } from "react";
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
import {
  getPaymentStatusLabel,
  getPaymentTypeLabel,
  getSubscriptionStatusLabel,
} from "@/lib/billing/labels";
interface BillingOverviewProps {
  subscription: Subscription | null;
  entitlement: ProductEntitlement | null;
  payments: PaymentRecord[];
  successfulPaymentCount: number;
  latestSuccessfulPaymentAt: Date | null;
}
function RedirectingToSubscriptionManagementToast() {
  const { t } = useTranslation();
  return (
    <>
      {t(
        "billing_redirecting_subscription_management",
        "Redirecting to subscription management...",
      )}
    </>
  );
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
  return <>{t("billing_no_active_subscription", "No active subscription")}</>;
}
function NotScheduledLabel() {
  const { t } = useTranslation();
  return <>{t("billing_not_scheduled", "Not scheduled")}</>;
}
function LatestPaymentDateLabel({ date }: { date: string }) {
  const { t } = useTranslation();
  return (
    <>
      {t("billing_latest", "Latest: {date}", {
        date,
      })}
    </>
  );
}
function NoPaymentRecordsLabel() {
  const { t } = useTranslation();
  return <>{t("billing_no_records_yet", "No records yet")}</>;
}
export function BillingOverview({
  subscription,
  entitlement,
  payments,
  successfulPaymentCount,
  latestSuccessfulPaymentAt,
}: BillingOverviewProps) {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const billingAccess = resolveBillingAccess(subscription, entitlement);
  const currentSubscription =
    billingAccess.kind === "subscription" ? billingAccess.subscription : null;
  const hasLifetimeAccess = billingAccess.kind === "lifetime";
  const canManage = canManageSubscription(subscription);
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
              {t("billing_current_plan", "Current Plan")}
            </CardDescription>
            <CardTitle className="text-base">
              {currentTierId ? (
                `${currentTierId.charAt(0).toUpperCase()}${currentTierId.slice(1)}`
              ) : (
                <>{t("billing_free", "Free")}</>
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
                {getSubscriptionStatusLabel(currentSubscription.status, t)}
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
                : t("billing_next_billing_date", "Next Billing Date")}
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
              <>
                {t(
                  "billing_subscription_ends_at_period_close",
                  "Subscription ends at period close",
                )}
              </>
            ) : (
              <>
                {t(
                  "billing_based_current_billing_cycle",
                  "Based on your current billing cycle",
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>
              {t("billing_successful_payments", "Successful Payments")}
            </CardDescription>
            <CardTitle className="text-base">
              {successfulPaymentCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground flex items-center gap-2 text-sm">
            <ReceiptText className="h-4 w-4" />
            {latestSuccessfulPaymentAt ? (
              <LatestPaymentDateLabel
                date={new Date(latestSuccessfulPaymentAt).toLocaleDateString(
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
          <CardTitle>
            {t("billing_subscription_management", "Subscription Management")}
          </CardTitle>
          <CardDescription>
            {t(
              "billing_use_billing_portal_update_payment_method",
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
              {t(
                "billing_manage_subscription",
                "{expression0} Manage Subscription",
                {
                  expression0: isPortalLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ),
                },
              )}
            </Button>
          ) : (
            <Button asChild>
              <LocalizedLink href="/pricing">
                {t("billing_view_plans", "View Plans")}
              </LocalizedLink>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("billing_payment_history", "Payment History")}
          </CardTitle>
          <CardDescription>
            {t(
              "billing_review_recent_subscription_one_time_payment",
              "Review your recent subscription and one-time payment records.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("billing_date", "Date")}</TableHead>
                  <TableHead>{t("billing_product", "Product")}</TableHead>
                  <TableHead>{t("billing_type", "Type")}</TableHead>
                  <TableHead>{t("billing_amount", "Amount")}</TableHead>
                  <TableHead>{t("billing_status", "Status")}</TableHead>
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
                        {getPaymentTypeLabel(payment.paymentType, t)}
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
                        {getPaymentStatusLabel(payment.status, t)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">
              {t(
                "billing_no_payment_history_found",
                "No payment history found.",
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
