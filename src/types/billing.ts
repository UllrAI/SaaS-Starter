import type {
  SubscriptionEntity,
  CustomerEntity,
  CheckoutEntity,
  CustomerLinksEntity as CreemCustomerPortalLink,
} from "creem/models/components";

export type {
  SubscriptionEntity,
  CustomerEntity,
  CheckoutEntity,
  CreemCustomerPortalLink,
};

export type PaymentMode = "subscription" | "one_time";
export type BillingCycle = "monthly" | "yearly";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "unpaid"
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

export interface CreateCheckoutOptions {
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

// --- Creem Webhook 事件对象详细类型定义 ---

export type CreemMetadata = {
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
  current_period_start_date: string;
  current_period_end_date: string;
  canceled_at: string | null;
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
  subscription?: CreemSubscriptionObject;
  order?: {
    id: string;
    transaction: string;
    amount_due: number;
    currency: string;
  };
}

export type CreemWebhookPayload = {
  id: string;
  eventType: string;
  created_at: number;
  object: CreemCheckoutObject | CreemSubscriptionObject | CreemPaymentObject;
};

export interface PaymentRecord {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  paymentType: string;
  productId: string; // Changed from tierId to productId to match db
  tierName: string; // Added missing tierName
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
  role: string;
  createdAt: Date;
  updatedAt: Date;
  subscriptions: {
    subscriptionId: string;
    status: string;
  }[];
}
