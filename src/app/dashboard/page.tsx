import { getServerTranslations } from "@/lib/i18n/translation/server";
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
import {
  getUserPayments,
  getUserSubscription,
} from "@/lib/database/subscription";
import { db } from "@/database";
import { uploads } from "@/database/schema";
import { formatCurrency } from "@/lib/utils";
import { formatFileSize } from "@/lib/config/upload";
import { createMetadataDefaults } from "@/lib/metadata";
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
  const { t } = await getServerTranslations();
  const metadata = createMetadataDefaults();
  return {
    ...metadata,
    title: t("268278a36d91", "Dashboard"),
    description: t(
      "045b5a0161f5",
      "Account overview, billing status, and starter setup progress.",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("2e5e078f6788", "Dashboard"),
      description: t(
        "549ad5b172bb",
        "Account overview, billing status, and starter setup progress.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("cb58fa7417a6", "Dashboard"),
      description: t(
        "c4a28414dd48",
        "Account overview, billing status, and starter setup progress.",
      ),
    },
  };
}
export default async function HomeRoute() {
  const { t } = await getServerTranslations();
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
      title: <>{t("c073a40a7e0b", "Review billing flow")}</>,
      description: (
        <>
          {t(
            "c6e1e570d858",
            "Check plan selection, checkout, and portal access.",
          )}
        </>
      ),
      href: "/dashboard/billing",
    },
    {
      id: "upload",
      title: <>{t("e1e660cf23a9", "Verify uploads")}</>,
      description: (
        <>
          {t(
            "f648e7207015",
            "Test client and server uploads against your storage config.",
          )}
        </>
      ),
      href: "/dashboard/upload",
    },
    {
      id: "settings",
      title: <>{t("fe6f44def372", "Finish account setup")}</>,
      description: (
        <>
          {t(
            "a70035543f9a",
            "Update your profile and validate theme and locale preferences.",
          )}
        </>
      ),
      href: "/dashboard/settings",
    },
  ];
  return (
    <DashboardPageWrapper
      title={<>{t("f33256a53736", "Dashboard")}</>}
      description={
        <>
          {t(
            "8a325ee3005b",
            "Account overview, billing status, and starter setup progress.",
          )}
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="text-primary h-5 w-5" />
              {t("03b04b82b57a", "Account overview")}
            </CardTitle>
            <CardDescription>
              {t(
                "c2b5a91643a5",
                "A summary of the account and starter modules currently in use.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="border-border space-y-2 border p-4">
              <p className="text-muted-foreground text-xs uppercase">
                {t("371bd6f449f6", "Plan")}
              </p>
              <p className="text-lg font-semibold">{subscriptionLabel}</p>
              <Badge
                className="capitalize"
                variant={
                  subscription &&
                  ["active", "trialing"].includes(subscription.status)
                    ? "default"
                    : "secondary"
                }
              >
                {subscription?.status ?? (
                  <>{t("4269fcc20a1d", "No active subscription")}</>
                )}
              </Badge>
            </div>
            <div className="border-border space-y-2 border p-4">
              <p className="text-muted-foreground text-xs uppercase">
                {t("8a69847fa5c4", "Uploads")}
              </p>
              <p className="text-lg font-semibold">{uploadedFileCount}</p>
              <p className="text-muted-foreground text-sm">
                {t("1639540e6c5b", "{expression0} stored", {
                  expression0: formatFileSize(uploadedFileSize),
                })}
              </p>
            </div>
            <div className="border-border space-y-2 border p-4">
              <p className="text-muted-foreground text-xs uppercase">
                {t("e6dc7b2a7611", "Payments")}
              </p>
              <p className="text-lg font-semibold">{payments.length}</p>
              <p className="text-muted-foreground text-sm">
                {latestPayment ? (
                  formatCurrency(
                    latestPayment.amount,
                    latestPayment.currency,
                    locale,
                  )
                ) : (
                  <>{t("e0ad3db6609c", "No payment records yet")}</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="text-primary h-5 w-5" />
              {t("ed775b2ca635", "Current account")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="border-border border p-4">
              <p className="text-muted-foreground">
                {t("71579b491980", "Name")}
              </p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div className="border-border border p-4">
              <p className="text-muted-foreground">
                {t("9c1b07e30177", "Email")}
              </p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div className="border-border border p-4">
              <p className="text-muted-foreground">
                {t("666a2a3f4ded", "Role")}
              </p>
              <p className="font-medium capitalize">
                {user.role.replace("_", " ")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-primary h-5 w-5" />
              {t("971aa604f9c3", "Setup checklist")}
            </CardTitle>
            <CardDescription>
              {t(
                "b4f335c74f5b",
                "The starter is already wired up. These are the next places to make it match your product.",
              )}
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
              {t("c595dd7db3ee", "Recent billing activity")}
            </CardTitle>
            <CardDescription>
              {t(
                "dfcc3bcdf4eb",
                "Recent payment records attached to your current account.",
              )}
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
                        {payment.status} •{" "}
                        {payment.paymentType.replace("_", " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(
                          payment.amount,
                          payment.currency,
                          locale,
                        )}
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
                  {t(
                    "5ed90e574285",
                    "No payment history yet. Visit billing when you are ready to test checkout.",
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardPageWrapper>
  );
}
