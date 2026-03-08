import React from "react";
import Link from "next/link";
import { count, eq, sum } from "drizzle-orm";
import { DashboardPageWrapper } from "./_components/dashboard-page-wrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/permissions";
import { getUserPayments, getUserSubscription } from "@/lib/database/subscription";
import { db } from "@/database";
import { uploads } from "@/database/schema";
import { formatCurrency } from "@/lib/utils";
import { formatFileSize } from "@/lib/config/upload";
import { createMetadata } from "@/lib/metadata";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import {
  ArrowRight,
  CreditCard,
  Files,
  ShieldCheck,
  Sparkles,
  UserCircle2,
} from "lucide-react";

export async function generateMetadata() {
  return createMetadata({
    title: "Dashboard",
    description: "Account overview, billing status, and starter setup progress.",
  });
}

export default async function HomeRoute() {
  const user = await requireAuth();
  const [locale, subscription, payments, [uploadSummary]] = await Promise.all([
    getRequestLocale(),
    getUserSubscription(user.id),
    getUserPayments(user.id, 5),
    db
      .select({
        count: count(),
        totalSize: sum(uploads.fileSize),
      })
      .from(uploads)
      .where(eq(uploads.userId, user.id)),
  ]);

  const latestPayment = payments[0] ?? null;
  const uploadedFileCount = uploadSummary?.count ?? 0;
  const uploadedFileSize = Number(uploadSummary?.totalSize ?? 0);
  const subscriptionLabel = subscription
    ? `${subscription.tierId.charAt(0).toUpperCase()}${subscription.tierId.slice(1)}`
    : "Free";
  const checklistLinks = [
    {
      id: "billing",
      title: <>Review billing flow</>,
      description: <>Check plan selection, checkout, and portal access.</>,
      href: "/dashboard/billing",
    },
    {
      id: "upload",
      title: <>Verify uploads</>,
      description: <>Test client and server uploads against your storage config.</>,
      href: "/dashboard/upload",
    },
    {
      id: "settings",
      title: <>Finish account setup</>,
      description: (
        <>Update your profile and validate theme and locale preferences.</>
      ),
      href: "/dashboard/settings",
    },
  ];

  return (
    <DashboardPageWrapper
      title={<>Dashboard</>}
      description={<>Account overview, billing status, and starter setup progress.</>}
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="text-primary h-5 w-5" />
              Account overview
            </CardTitle>
            <CardDescription>
              A summary of the account and starter modules currently in use.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="border-border space-y-2 border p-4">
              <p className="text-muted-foreground text-xs uppercase">Plan</p>
              <p className="text-lg font-semibold">{subscriptionLabel}</p>
              <Badge
                className="capitalize"
                variant={
                  subscription && ["active", "trialing"].includes(subscription.status)
                    ? "default"
                    : "secondary"
                }
              >
                {subscription?.status ?? <>No active subscription</>}
              </Badge>
            </div>
            <div className="border-border space-y-2 border p-4">
              <p className="text-muted-foreground text-xs uppercase">Uploads</p>
              <p className="text-lg font-semibold">{uploadedFileCount}</p>
              <p className="text-muted-foreground text-sm">
                {formatFileSize(uploadedFileSize)} stored
              </p>
            </div>
            <div className="border-border space-y-2 border p-4">
              <p className="text-muted-foreground text-xs uppercase">Payments</p>
              <p className="text-lg font-semibold">{payments.length}</p>
              <p className="text-muted-foreground text-sm">
                {latestPayment
                  ? formatCurrency(
                      latestPayment.amount,
                      latestPayment.currency,
                      locale,
                    )
                  : <>No payment records yet</>}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="text-primary h-5 w-5" />
              Current account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="border-border border p-4">
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div className="border-border border p-4">
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div className="border-border border p-4">
              <p className="text-muted-foreground">Role</p>
              <p className="font-medium capitalize">{user.role.replace("_", " ")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-primary h-5 w-5" />
              Setup checklist
            </CardTitle>
            <CardDescription>
              The starter is already wired up. These are the next places to make
              it match your product.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {checklistLinks.map((item) => (
              <div key={item.id} className="border-border border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {item.description}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={item.href}>
                      <>Open</>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="text-primary h-5 w-5" />
              Recent billing activity
            </CardTitle>
            <CardDescription>
              Recent payment records attached to your current account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.paymentId}
                    className="border-border flex items-center justify-between gap-4 border p-4"
                  >
                    <div>
                      <p className="font-medium">{payment.tierName}</p>
                      <p className="text-muted-foreground text-sm capitalize">
                        {payment.status} • {payment.paymentType.replace("_", " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(payment.amount, payment.currency, locale)}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {new Date(payment.createdAt).toLocaleDateString(locale)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-border flex items-center gap-3 border p-4 text-sm">
                <Files className="text-primary h-4 w-4" />
                <span className="text-muted-foreground">
                  No payment history yet. Visit billing when you are ready to
                  test checkout.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardPageWrapper>
  );
}
