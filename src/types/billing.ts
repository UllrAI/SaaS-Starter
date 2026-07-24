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

interface CreemTransactionReference {
  id: string;
  order?: string;
  amount: number;
  amount_paid?: number | null;
  refunded_amount?: number | null;
  status:
    | "pending"
    | "paid"
    | "refunded"
    | "partialRefund"
    | "chargedBack"
    | "uncollectible"
    | "declined"
    | "canceled"
    | "void";
}

export interface CreemRefundObject {
  id: string;
  status: "pending" | "requiresAction" | "succeeded" | "failed" | "canceled";
  refund_amount: number;
  transaction: CreemTransactionReference;
}

export interface CreemDisputeObject {
  id: string;
  amount: number;
  transaction: CreemTransactionReference;
}

export interface CreateCheckoutOptions {
  requestId: string;
  userId: string;
  userEmail: string;
  userName?: string | null;
  tierId: string;
  paymentMode: PaymentMode;
  billingCycle?: BillingCycle;
  successUrl: string;
  cancelUrl?: string;
  failureUrl?: string;
}

// --- Detailed Creem webhook object types ---

type CreemMetadata = {
  userId?: string;
  tierId?: string;
  paymentMode?: PaymentMode;
  billingCycle?: BillingCycle;
  [key: string]: unknown;
};

interface CreemBaseObject {
  id: string;
  customer: string | { id: string };
  metadata?: CreemMetadata;
}

export interface CreemSubscriptionObject extends CreemBaseObject {
  product: string | { id: string };
  status: SubscriptionStatus;
  current_period_start_date?: string;
  current_period_end_date?: string;
  canceled_at?: string | null;
}

export interface CreemPaymentObject extends CreemBaseObject {
  subscription_id?: string;
  subscription?: string;
  product_id?: string;
  amount: number;
  amount_paid?: number;
  currency: string;
  billing_reason?: "subscription_cycle" | "subscription_create";
  lines?: {
    data?: Array<{
      period: {
        start: number;
        end: number;
      };
      price?: {
        product?: string;
      };
    }>;
  };
}

export interface CreemCheckoutObject extends CreemBaseObject {
  product: string | { id: string };
  subscription?: CreemSubscriptionObject;
  order?: {
    id: string;
    transaction?: string;
    amount: number;
    amount_due?: number;
    currency: string;
  };
}

export type CreemWebhookPayload = {
  id: string;
  eventType: string;
  created_at: number;
  object:
    | CreemCheckoutObject
    | CreemSubscriptionObject
    | CreemPaymentObject
    | CreemRefundObject
    | CreemDisputeObject;
};

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
