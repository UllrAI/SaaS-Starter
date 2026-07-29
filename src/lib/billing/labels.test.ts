import type { AppTranslate } from "@/lib/i18n/translation/shared";
import {
  getPaymentStatusLabel,
  getPaymentTypeLabel,
  getSubscriptionStatusLabel,
} from "./labels";

const translate = ((key: string, fallback: string) =>
  `${key}:${fallback}`) as AppTranslate;

describe("billing labels", () => {
  it("uses shared subscription status translations", () => {
    expect(getSubscriptionStatusLabel("scheduled_cancel", translate)).toBe(
      "subscription_status_scheduled_cancel:Scheduled to cancel",
    );
  });

  it("uses shared payment status and type translations", () => {
    expect(getPaymentStatusLabel("succeeded", translate)).toBe(
      "billing_payment_status_succeeded:Succeeded",
    );
    expect(getPaymentTypeLabel("one_time", translate)).toBe(
      "billing_payment_type_one_time:One-time purchase",
    );
  });

  it("falls back safely for unknown persisted values", () => {
    expect(getPaymentStatusLabel("unexpected", translate)).toBe(
      "billing_payment_status_unknown:Unknown",
    );
    expect(getPaymentTypeLabel("unexpected", translate)).toBe(
      "508d3b02ab09:Unknown",
    );
  });
});
