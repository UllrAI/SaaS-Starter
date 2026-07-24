import { getServerTranslations } from "@/lib/i18n/translation/server";
import "@/styles/globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import {
  APP_NAME,
  COMPANY_NAME,
  OGIMAGE,
  TWITTERACCOUNT,
} from "@/lib/config/constants";
import type { Metadata } from "next";
import { AppProviders } from "@/components/app-providers";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { AppIntlProvider } from "@/lib/i18n/provider";
import { loadMessages } from "@/lib/i18n/messages";
import { absoluteUrl, APP_ORIGIN } from "@/lib/url";
const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    metadataBase: new URL(APP_ORIGIN),
    applicationName: APP_NAME,
    authors: [
      {
        name: COMPANY_NAME,
        url: APP_ORIGIN,
      },
    ],
    creator: COMPANY_NAME,
    publisher: COMPANY_NAME,
    title: {
      template: `%s | ${APP_NAME}`,
      default: APP_NAME,
    },
    description: t(
      "47ef1ddddc70",
      "Complete Micro UllrAI SaaS starter with authentication, payments, database, and deployment.",
    ),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: APP_NAME,
      description: t(
        "0863940a3e2f",
        "Complete Micro UllrAI SaaS starter with authentication, payments, database, and deployment.",
      ),
      images: OGIMAGE,
      siteName: APP_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      creator: TWITTERACCOUNT,
      title: APP_NAME,
      description: t(
        "64b8511aff17",
        "Complete Micro UllrAI SaaS starter with authentication, payments, database, and deployment.",
      ),
      images: OGIMAGE,
    },
  };
}
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": absoluteUrl("/#organization"),
        name: COMPANY_NAME,
        url: APP_ORIGIN,
        logo: absoluteUrl("/logo.png"),
      },
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        name: APP_NAME,
        url: APP_ORIGIN,
        publisher: {
          "@id": absoluteUrl("/#organization"),
        },
        inLanguage: locale,
      },
    ],
  };
  return (
    <html
      lang={locale}
      className={`${fontSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <head />
      <body>
        <AppIntlProvider locale={locale} messages={messages}>
          <AppProviders>{children}</AppProviders>
        </AppIntlProvider>
        <script
          id="website-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
