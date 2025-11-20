"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { Subscription, PaymentRecord } from "@/types/billing";
import { useRouter } from "nextjs-toploader/app";

interface BillingPageProps {
  subscription: Subscription | null;
  payments: PaymentRecord[];
}

export function BillingPage({ subscription, payments }: BillingPageProps) {
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const router = useRouter();

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    toast.info("Redirecting to subscription management...");
    try {
      const response = await fetch("/api/billing/portal");
      const data = await response.json();
      if (response.ok && data.portalUrl) {
        window.location.href = data.portalUrl;
      } else {
        throw new Error(data.error || "Could not create portal session.");
      }
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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing & Plans</h2>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Subscription */}
      {subscription ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Current Plan:{" "}
                  {subscription.tierId.charAt(0).toUpperCase() +
                    subscription.tierId.slice(1)}
                </CardTitle>
                <CardDescription>Your active plan details.</CardDescription>
              </div>
              <Badge
                variant={
                  ["active", "trialing"].includes(subscription.status)
                    ? "default"
                    : "destructive"
                }
                className="capitalize"
              >
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                {subscription.canceledAt ? (
                  <>
                    Your subscription will end on{" "}
                    {subscription.currentPeriodEnd?.toLocaleDateString()}
                  </>
                ) : (
                  <>
                    Your subscription renews on{" "}
                    {subscription.currentPeriodEnd?.toLocaleDateString()}
                  </>
                )}
              </p>
            </div>
            <Button
              className="mt-4"
              onClick={handleManageSubscription}
              disabled={isPortalLoading}
            >
              {isPortalLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Manage Subscription
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>
              Upgrade to unlock premium features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/pricing")}>View Plans</Button>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View your recent purchases and subscription payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments && payments.length > 0 ? (
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
                      {new Date(payment.createdAt).toLocaleDateString()}
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
                        {payment.paymentType === "one_time" ? (
                          <>One Time Purchase</>
                        ) : (
                          <>Subscription</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(payment.amount, payment.currency)}
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
            <p className="text-muted-foreground text-sm">
              No payment history found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
