import { getServerTranslations } from "@/lib/i18n/translation/server";
import { APP_NAME, OGIMAGE, TWITTERACCOUNT } from "@/lib/config/constants";
import env from "@/env";
import type { Metadata } from "next";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
    robots: {
      index: false,
      follow: false,
    },
    title: t("a508b20394f7", "Payment Status"),
    description: t(
      "f463a3cfcba4",
      "Check your payment status and next steps for your subscription.",
    ),
    openGraph: {
      title: t("da5b22c0e841", "Payment Status"),
      description: t(
        "8f8029a1177c",
        "Check your payment status and next steps for your subscription.",
      ),
      images: OGIMAGE,
      siteName: APP_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      creator: TWITTERACCOUNT,
      title: t("eb81c62b0ebb", "Payment Status"),
      description: t(
        "fc23ed777341",
        "Check your payment status and next steps for your subscription.",
      ),
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
