import { APP_NAME, OGIMAGE, TWITTERACCOUNT } from "@/lib/config/constants";
import env from "@/env";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
    robots: {
      index: false,
      follow: false,
    },
    title: "Payment Status",
    description:
      "Check your payment status and next steps for your subscription.",
    openGraph: {
      title: "Payment Status",
      description:
        "Check your payment status and next steps for your subscription.",
      images: OGIMAGE,
      siteName: APP_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      creator: TWITTERACCOUNT,
      title: "Payment Status",
      description:
        "Check your payment status and next steps for your subscription.",
      images: OGIMAGE,
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
