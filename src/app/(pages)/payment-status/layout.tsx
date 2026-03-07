import { createMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const metadata = createMetadata({
    robots: {
      index: false,
      follow: false,
    },
  });

  return {
    ...metadata,
    title: "Payment Status",
    description: "Check your payment status and next steps for your subscription.",
    openGraph: {
      ...metadata.openGraph,
      title: "Payment Status",
      description:
        "Check your payment status and next steps for your subscription.",
    },
    twitter: {
      ...metadata.twitter,
      title: "Payment Status",
      description:
        "Check your payment status and next steps for your subscription.",
    },
  };
}

export default function PaymentStatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
