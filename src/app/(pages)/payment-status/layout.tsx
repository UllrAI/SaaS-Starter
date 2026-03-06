import { createPageMetadata } from "@/lib/i18n/page-metadata";

async function PaymentStatusMetadataTitle() {
  return <>Payment Status</>;
}

async function PaymentStatusMetadataDescription() {
  return <>Check your payment status and next steps for your subscription.</>;
}

export async function generateMetadata() {
  return createPageMetadata({
    title: PaymentStatusMetadataTitle,
    description: PaymentStatusMetadataDescription,
    robots: {
      index: false,
      follow: false,
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
