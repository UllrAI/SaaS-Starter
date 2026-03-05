"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import { CalendarClock, CreditCard, Loader2, ReceiptText } from "lucide-react";
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
import { formatCurrency } from "@/lib/utils";
import type { PaymentRecord, Subscription } from "@/types/billing";

interface BillingOverviewProps {
  subscription: Subscription | null;
  payments: PaymentRecord[];
}

export function BillingOverview({ subscription, payments }: BillingOverviewProps) {
  const intlLocale = useIntlLocale();
  const router = useRouter();
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const paymentSummary = useMemo(() => {
    const successfulPayments = payments.filter(
      (payment) => payment.status === "succeeded",
    );

    return {
      count: successfulPayments.length,
      latestDate: successfulPayments[0]?.createdAt ?? null,
    };
  }, [payments]);

  const nextBillingDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString(intlLocale)
    : null;

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    toast.info("Redirecting to subscription management...");

    try {
      const response = await fetch("/api/billing/portal");
      const data = await response.json();
      const safePortalUrl = getSafeBillingRedirectUrl(
        data.portalUrl,
        window.location,
      );

      if (!response.ok || !safePortalUrl) {
        throw new Error(
          data.error ||
            (response.ok
              ? "Received an unsafe management URL."
              : "Could not create portal session."),
        );
      }

      window.location.assign(safePortalUrl);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An error occurred.",
      );
    } finally {
      setIsPortalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Plan</CardDescription>
            <CardTitle className="text-base">
              {subscription
                ? `${subscription.tierId.charAt(0).toUpperCase()}${subscription.tierId.slice(1)}`
                : <>Free</>}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm">
            {/* <CreditCard className="text-muted-foreground h-4 w-4" /> */}
            {subscription ? (
              <Badge
                className="capitalize"
                variant={
                  ["active", "trialing"].includes(subscription.status)
                    ? "default"
                    : "destructive"
                }
              >
                {subscription.status}
              </Badge>
            ) : (
              <span className="text-muted-foreground">No active subscription</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Next Billing Date</CardDescription>
            <CardTitle className="text-base">
              {nextBillingDate || "Not scheduled"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground flex items-center gap-2 text-sm">
            <CalendarClock className="h-4 w-4" />
            {subscription?.canceledAt
              ? <>Subscription ends at period close</>
              : <>Based on your current billing cycle</>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Successful Payments</CardDescription>
            <CardTitle className="text-base">{paymentSummary.count}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground flex items-center gap-2 text-sm">
            <ReceiptText className="h-4 w-4" />
            {paymentSummary.latestDate
              ? `Latest: ${new Date(paymentSummary.latestDate).toLocaleDateString(intlLocale)}`
              : "No records yet"}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>
            Use the billing portal to update your payment method, invoices, and
            subscription status.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {subscription ? (
            <Button onClick={handleManageSubscription} disabled={isPortalLoading}>
              {isPortalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Manage Subscription
            </Button>
          ) : (
            <Button onClick={() => router.push("/pricing")}>View Plans</Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Review your recent subscription and one-time payment records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">
                      {new Date(payment.createdAt).toLocaleDateString(intlLocale)}
                    </TableCell>
                    <TableCell className="font-medium">{payment.tierName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.paymentType === "one_time"
                            ? "secondary"
                            : "default"
                        }
                      >
                        {payment.paymentType === "one_time"
                          ? "One Time Purchase"
                          : "Subscription"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(payment.amount, payment.currency, intlLocale)}
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
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">No payment history found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
