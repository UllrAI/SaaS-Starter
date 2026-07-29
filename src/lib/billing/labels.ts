import type { AppTranslate } from "@/lib/i18n/translation/shared";
import type { SubscriptionStatus } from "@/types/billing";

interface BillingLabel {
  key: string;
  fallback: string;
}

const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, BillingLabel> = {
  active: { key: "billing_status_active", fallback: "Active" },
  canceled: { key: "billing_status_canceled", fallback: "Canceled" },
  expired: { key: "subscription_status_expired", fallback: "Expired" },
  past_due: { key: "billing_past_due", fallback: "Past Due" },
  unpaid: { key: "billing_unpaid", fallback: "Unpaid" },
  paused: { key: "subscription_status_paused", fallback: "Paused" },
  scheduled_cancel: {
    key: "subscription_status_scheduled_cancel",
    fallback: "Scheduled to cancel",
  },
  trialing: { key: "billing_status_trialing", fallback: "Trialing" },
  incomplete: { key: "billing_incomplete", fallback: "Incomplete" },
};

const PAYMENT_STATUS_LABELS = {
  succeeded: {
    key: "billing_payment_status_succeeded",
    fallback: "Succeeded",
  },
  pending: { key: "billing_payment_status_pending", fallback: "Pending" },
  failed: { key: "billing_payment_status_failed", fallback: "Failed" },
  refunded: { key: "billing_payment_status_refunded", fallback: "Refunded" },
  partially_refunded: {
    key: "billing_payment_status_partially_refunded",
    fallback: "Partially refunded",
  },
  disputed: { key: "billing_payment_status_disputed", fallback: "Disputed" },
  canceled: { key: "billing_status_canceled", fallback: "Canceled" },
} as const satisfies Record<string, BillingLabel>;

const PAYMENT_TYPE_LABELS = {
  subscription: {
    key: "billing_payment_type_subscription",
    fallback: "Subscription",
  },
  one_time: {
    key: "billing_payment_type_one_time",
    fallback: "One-time purchase",
  },
  card: { key: "billing_credit_card", fallback: "Credit Card" },
  bank_transfer: { key: "billing_bank_transfer", fallback: "Bank Transfer" },
  paypal: { key: "billing_paypal", fallback: "PayPal" },
} as const satisfies Record<string, BillingLabel>;

const UNKNOWN_PAYMENT_STATUS: BillingLabel = {
  key: "billing_payment_status_unknown",
  fallback: "Unknown",
};
const UNKNOWN_PAYMENT_TYPE: BillingLabel = {
  key: "billing_unknown",
  fallback: "Unknown",
};

function translateLabel(label: BillingLabel, t: AppTranslate): string {
  return t(label.key, label.fallback);
}

export function getSubscriptionStatusLabel(
  status: SubscriptionStatus,
  t: AppTranslate,
): string {
  return translateLabel(SUBSCRIPTION_STATUS_LABELS[status], t);
}

export function getPaymentStatusLabel(status: string, t: AppTranslate): string {
  const label =
    PAYMENT_STATUS_LABELS[status as keyof typeof PAYMENT_STATUS_LABELS] ??
    UNKNOWN_PAYMENT_STATUS;
  return translateLabel(label, t);
}

export function getPaymentTypeLabel(
  paymentType: string,
  t: AppTranslate,
): string {
  const label =
    PAYMENT_TYPE_LABELS[paymentType as keyof typeof PAYMENT_TYPE_LABELS] ??
    UNKNOWN_PAYMENT_TYPE;
  return translateLabel(label, t);
}
