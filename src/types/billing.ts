export type PaymentMode = "subscription" | "one_time";
export type BillingCycle = "monthly" | "yearly";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "expired"
  | "past_due"
  | "unpaid"
  | "paused"
  | "scheduled_cancel"
  | "trialing"
  | "incomplete";

export interface Subscription {
  id: string;
  userId: string;
  customerId: string;
  subscriptionId: string;
  status: SubscriptionStatus;
  tierId: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  canceledAt?: Date | null;
}

export interface ProductEntitlement {
  id: string;
  userId: string;
  productId: string;
  sourcePaymentId: string;
  revokedAt: Date | null;
  revocationReason: string | null;
  createdAt: Date;
}

export interface CreateCheckoutOptions {
  requestId: string;
  userId: string;
  /** Provider customer, resolved before checkout so a user has exactly one. */
  customerId: string;
  tierId: string;
  paymentMode: PaymentMode;
  billingCycle?: BillingCycle;
  successUrl: string;
  cancelUrl?: string;
  failureUrl?: string;
}

export interface PaymentRecord {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  paymentType: string;
  productId: string;
  tierName: string;
  createdAt: Date;
  subscriptionId: string | null;
}

export interface SubscriptionWithUser {
  id: string;
  userId: string;
  customerId: string;
  subscriptionId: string;
  status: SubscriptionStatus;
  tierId: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  canceledAt: Date | null;
  planName: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentWithUser extends PaymentRecord {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

export interface UserWithSubscription {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: boolean | null;
  image: string | null;
  role: "user" | "admin" | "super_admin";
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
  subscriptions: {
    subscriptionId: string;
    status: string;
  }[];
}
