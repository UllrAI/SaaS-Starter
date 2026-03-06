import { createLocalizedMetadata } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return createLocalizedMetadata({
    en: {
      title: "Payment Status",
      description: "Check your payment status and next steps for your subscription.",
      robots: {
        index: false,
        follow: false,
      },
    },
    "zh-Hans": {
      title: "支付状态",
      description: "查看当前支付状态以及订阅的后续步骤。",
      robots: {
        index: false,
        follow: false,
      },
    },
  });
}

export default function PaymentStatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
