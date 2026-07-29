import { render, screen } from "@testing-library/react";
import { BillingOverview } from "./billing-overview";
import type { ProductEntitlement, Subscription } from "@/types/billing";

jest.mock("nextjs-toploader/app", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const expiredSubscription: Subscription = {
  id: "subscription-row",
  userId: "user-1",
  customerId: "customer-1",
  subscriptionId: "subscription-1",
  status: "expired",
  tierId: "plus",
  currentPeriodEnd: new Date("2025-01-01T00:00:00Z"),
};

const lifetimeEntitlement: ProductEntitlement = {
  id: "entitlement-1",
  userId: "user-1",
  productId: "team",
  sourcePaymentId: "payment-1",
  revokedAt: null,
  revocationReason: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

describe("BillingOverview", () => {
  it("presents lifetime access when only a historical subscription remains", () => {
    render(
      <BillingOverview
        subscription={expiredSubscription}
        entitlement={lifetimeEntitlement}
        payments={[]}
        successfulPaymentCount={0}
        latestSuccessfulPaymentAt={null}
      />,
    );

    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Lifetime access")).toBeInTheDocument();
    expect(screen.queryByText("expired")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Manage Subscription/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the all-time successful payment count independently of recent history", () => {
    render(
      <BillingOverview
        subscription={null}
        entitlement={null}
        payments={[]}
        successfulPaymentCount={27}
        latestSuccessfulPaymentAt={new Date("2026-02-03T00:00:00Z")}
      />,
    );

    expect(screen.getByText("27")).toBeInTheDocument();
    expect(screen.getByText(/Latest:/)).toHaveTextContent("2/3/2026");
  });
});
