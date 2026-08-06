import {
  getPaymentStatusLabel,
  getPaymentTypeLabel,
  getSubscriptionStatusLabel,
} from "./labels";

const translate = (key: string) => key;

describe("billing labels", () => {
  it("uses shared subscription status translations", () => {
    expect(getSubscriptionStatusLabel("scheduled_cancel", translate)).toBe(
      "subscription_status_scheduled_cancel",
    );
  });

  it("uses shared payment status and type translations", () => {
    expect(getPaymentStatusLabel("succeeded", translate)).toBe(
      "billing_payment_status_succeeded",
    );
    expect(getPaymentTypeLabel("one_time", translate)).toBe(
      "billing_payment_type_one_time",
    );
  });

  it("falls back safely for unknown persisted values", () => {
    expect(getPaymentStatusLabel("unexpected", translate)).toBe(
      "billing_payment_status_unknown",
    );
    expect(getPaymentTypeLabel("unexpected", translate)).toBe(
      "billing_unknown",
    );
  });
});
