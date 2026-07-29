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
  past_due: { key: "64f180e9fb46", fallback: "Past Due" },
  unpaid: { key: "685a7728149e", fallback: "Unpaid" },
  paused: { key: "subscription_status_paused", fallback: "Paused" },
  scheduled_cancel: {
    key: "subscription_status_scheduled_cancel",
    fallback: "Scheduled to cancel",
  },
  trialing: { key: "billing_status_trialing", fallback: "Trialing" },
  incomplete: { key: "4704260a99f1", fallback: "Incomplete" },
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
  card: { key: "161489760794", fallback: "Credit Card" },
  bank_transfer: { key: "39a38e00159d", fallback: "Bank Transfer" },
  paypal: { key: "bb6bd6003b71", fallback: "PayPal" },
} as const satisfies Record<string, BillingLabel>;

const UNKNOWN_PAYMENT_STATUS: BillingLabel = {
  key: "billing_payment_status_unknown",
  fallback: "Unknown",
};
const UNKNOWN_PAYMENT_TYPE: BillingLabel = {
  key: "508d3b02ab09",
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
