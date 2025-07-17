import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Status | SaaS Starter",
  description:
    "Check your payment status and next steps for your subscription.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaymentStatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
