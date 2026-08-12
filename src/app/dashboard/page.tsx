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
  getUserPaymentCount,
  getUserPayments,
  getUserProductEntitlement,
  getUserSubscription,
} from "@/lib/database/subscription";
import { resolveBillingAccess } from "@/lib/billing/access";
import { db } from "@/database";
import { uploads } from "@/database/schema";
import { formatCurrency } from "@/lib/utils";
import { formatFileSize } from "@/lib/config/upload";
import { createMetadataDefaults } from "@/lib/metadata";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import {
  getPaymentStatusLabel,
  getPaymentTypeLabel,
  getSubscriptionStatusLabel,
} from "@/lib/billing/labels";
import {
  ArrowRight,
  CreditCard,
  Files,
  ShieldCheck,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { SITE_CONFIG } from "@/lib/config/site";

function getPlanLabel(planId: string | null, t: (key: string) => string) {
  switch (planId) {
    case "plus":
      return t("dashboard_plan_plus");
    case "pro":
      return t("dashboard_plan_professional");
    case "team":
      return t("dashboard_plan_team");
    default:
      return planId ?? t("dashboard_plan_free");
  }
}

function getRoleLabel(role: string, t: (key: string) => string) {
  switch (role) {
    case "admin":
      return t("common_admin");
    case "super_admin":
      return t("common_super_admin");
    default:
      return t("common_user");
  }
}

export async function generateMetadata() {
  const { locale, t } = await getServerTranslations();
  const metadata = createMetadataDefaults({ locale });
  return {
    ...metadata,
    title: t("dashboard_title"),
    description: t("dashboard_account_summary"),
    openGraph: {
      ...metadata.openGraph,
      title: t("dashboard_title"),
      description: t("dashboard_account_summary"),
    },
    twitter: {
      ...metadata.twitter,
      title: t("dashboard_title"),
      description: t("dashboard_account_summary_description"),
    },
  };
}
export default async function HomeRoute() {
  const { t } = await getServerTranslations();
  const user = await requireAuth();
  const [
    locale,
    subscription,
    entitlement,
    payments,
    paymentCount,
    [uploadSummary],
  ] = await Promise.all([
    getRequestLocale(),
    SITE_CONFIG.features.billing
      ? getUserSubscription(user.id)
      : Promise.resolve(null),
    SITE_CONFIG.features.billing
      ? getUserProductEntitlement(user.id)
      : Promise.resolve(null),
    SITE_CONFIG.features.billing
      ? getUserPayments(user.id, 5)
      : Promise.resolve([]),
    SITE_CONFIG.features.billing
      ? getUserPaymentCount(user.id)
      : Promise.resolve(0),
    SITE_CONFIG.features.uploads
      ? db
          .select({
            count: count(),
            totalSize: sum(uploads.fileSize),
          })
          .from(uploads)
          .where(eq(uploads.userId, user.id))
      : Promise.resolve([{ count: 0, totalSize: null }]),
  ]);
  const latestPayment = payments[0] ?? null;
  const uploadedFileCount = uploadSummary?.count ?? 0;
  const uploadedFileSize = Number(uploadSummary?.totalSize ?? 0);
  const billingAccess = resolveBillingAccess(subscription, entitlement);
  const currentPlanId =
    billingAccess.kind === "subscription"
      ? billingAccess.subscription.tierId
      : billingAccess.kind === "lifetime"
        ? billingAccess.entitlement.productId
        : null;
  const subscriptionLabel = getPlanLabel(currentPlanId, t);
  const checklistLinks = [
    {
      id: "billing",
      title: <>{t("dashboard_review_billing_flow")}</>,
      description: <>{t("dashboard_check_billing_flow")}</>,
      href: "/dashboard/billing",
    },
    {
      id: "upload",
      title: <>{t("dashboard_verify_uploads")}</>,
      description: <>{t("dashboard_test_uploads")}</>,
      href: "/dashboard/upload",
    },
    {
      id: "settings",
      title: <>{t("dashboard_finish_account_setup")}</>,
      description: <>{t("dashboard_update_profile_preferences")}</>,
      href: "/dashboard/settings",
    },
  ].filter(
    (item) =>
      (SITE_CONFIG.features.billing || item.id !== "billing") &&
      (SITE_CONFIG.features.uploads || item.id !== "upload"),
  );
  return (
    <DashboardPageWrapper
      title={<>{t("dashboard_title")}</>}
      description={<>{t("dashboard_account_summary")}</>}
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="text-primary h-5 w-5" />
              {t("dashboard_account_overview")}
            </CardTitle>
            <CardDescription>{t("dashboard_summary_modules")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {SITE_CONFIG.features.billing && (
              <div className="border-border space-y-2 border p-4">
                <p className="text-muted-foreground text-xs uppercase">
                  {t("dashboard_plan")}
                </p>
                <p className="text-lg font-semibold">{subscriptionLabel}</p>
                <Badge
                  className="capitalize"
                  variant={
                    billingAccess.kind !== "free" ? "default" : "secondary"
                  }
                >
                  {billingAccess.kind === "subscription" ? (
                    getSubscriptionStatusLabel(
                      billingAccess.subscription.status,
                      t,
                    )
                  ) : billingAccess.kind === "lifetime" ? (
                    <>{t("billing_lifetime_access")}</>
                  ) : (
                    <>{t("dashboard_no_active_subscription")}</>
                  )}
                </Badge>
              </div>
            )}
            {SITE_CONFIG.features.uploads && (
              <div className="border-border space-y-2 border p-4">
                <p className="text-muted-foreground text-xs uppercase">
                  {t("dashboard_uploads")}
                </p>
                <p className="text-lg font-semibold">{uploadedFileCount}</p>
                <p className="text-muted-foreground text-sm">
                  {t("dashboard_stored", {
                    expression0: formatFileSize(uploadedFileSize),
                  })}
                </p>
              </div>
            )}
            {SITE_CONFIG.features.billing && (
              <div className="border-border space-y-2 border p-4">
                <p className="text-muted-foreground text-xs uppercase">
                  {t("dashboard_payments")}
                </p>
                <p className="text-lg font-semibold">{paymentCount}</p>
                <p className="text-muted-foreground text-sm">
                  {latestPayment ? (
                    formatCurrency(
                      latestPayment.amount,
                      latestPayment.currency,
                      locale,
                    )
                  ) : (
                    <>{t("dashboard_no_payment_records_yet")}</>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="text-primary h-5 w-5" />
              {t("dashboard_current_account")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="border-border border p-4">
              <p className="text-muted-foreground">{t("dashboard_name")}</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div className="border-border border p-4">
              <p className="text-muted-foreground">{t("dashboard_email")}</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div className="border-border border p-4">
              <p className="text-muted-foreground">{t("dashboard_role")}</p>
              <p className="font-medium capitalize">
                {getRoleLabel(user.role, t)}
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
              {t("dashboard_setup_checklist")}
            </CardTitle>
            <CardDescription>
              {t("dashboard_starter_already_wired_up_these_next")}
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
                      <>{t("dashboard_checklist_open")}</>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {SITE_CONFIG.features.billing && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="text-primary h-5 w-5" />
                {t("dashboard_recent_billing_activity")}
              </CardTitle>
              <CardDescription>
                {t("dashboard_recent_payment_records")}
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
                        <p className="text-muted-foreground text-sm">
                          {getPaymentStatusLabel(payment.status, t)} •{" "}
                          {getPaymentTypeLabel(payment.paymentType, t)}
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
                          {new Date(payment.createdAt).toLocaleDateString(
                            locale,
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-border flex items-center gap-3 border p-4 text-sm">
                  <Files className="text-primary h-4 w-4" />
                  <span className="text-muted-foreground">
                    {t("dashboard_no_payment_history")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardPageWrapper>
  );
}
