import { getServerTranslations } from "@/lib/i18n/translation/server";
import { APP_NAME, OGIMAGE, TWITTERACCOUNT } from "@/lib/config/constants";
import env from "@/env";
import type { Metadata } from "next";
import {
  SOURCE_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/config/i18n";
import { getOpenGraphLocale } from "@/lib/metadata";
export async function buildPaymentStatusMetadata(
  locale: SupportedLocale,
): Promise<Metadata> {
  const { t } = await getServerTranslations({ locale });
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
    robots: {
      index: false,
      follow: false,
    },
    title: t("billing_payment_status"),
    description: t("billing_payment_status_next_steps_description"),
    openGraph: {
      title: t("billing_payment_status"),
      description: t("billing_payment_status_next_steps"),
      images: [{ url: OGIMAGE, width: 1480, height: 777, alt: APP_NAME }],
      locale: getOpenGraphLocale(locale),
      alternateLocale: SUPPORTED_LOCALES.filter(
        (supportedLocale) => supportedLocale !== locale,
      ).map(getOpenGraphLocale),
      siteName: APP_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      creator: TWITTERACCOUNT,
      title: t("billing_payment_status"),
      description: t("billing_payment_status_next_steps_description"),
      images: [{ url: OGIMAGE, width: 1480, height: 777, alt: APP_NAME }],
    },
  };
}
export function generateMetadata(): Promise<Metadata> {
  return buildPaymentStatusMetadata(SOURCE_LOCALE);
}
export default function PaymentStatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
