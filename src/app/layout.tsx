import "@/styles/globals.css";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import {
  APP_NAME,
  COMPANY_NAME,
  OGIMAGE,
  TWITTERACCOUNT,
} from "@/lib/config/constants";
import env from "@/env";
import type { Metadata } from "next";

import { AppProviders } from "@/components/app-providers";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { AppLingoProvider } from "@/lib/i18n/lingo-provider";
import { loadLingoTranslations } from "@/lib/i18n/lingo-translations";

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
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
    applicationName: APP_NAME,
    authors: [{ name: COMPANY_NAME, url: env.NEXT_PUBLIC_APP_URL }],
    creator: COMPANY_NAME,
    publisher: COMPANY_NAME,
    title: {
      template: `%s | ${APP_NAME}`,
      default: APP_NAME,
    },
    description:
      "Complete Micro UllrAI SaaS starter with authentication, payments, database, and deployment.",
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
      description:
        "Complete Micro UllrAI SaaS starter with authentication, payments, database, and deployment.",
      images: OGIMAGE,
      siteName: APP_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      creator: TWITTERACCOUNT,
      title: APP_NAME,
      description:
        "Complete Micro UllrAI SaaS starter with authentication, payments, database, and deployment.",
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
  const translations = await loadLingoTranslations(locale);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${env.NEXT_PUBLIC_APP_URL}/#organization`,
        name: COMPANY_NAME,
        url: env.NEXT_PUBLIC_APP_URL,
        logo: `${env.NEXT_PUBLIC_APP_URL}/logo.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${env.NEXT_PUBLIC_APP_URL}/#website`,
        name: APP_NAME,
        url: env.NEXT_PUBLIC_APP_URL,
        publisher: {
          "@id": `${env.NEXT_PUBLIC_APP_URL}/#organization`,
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
        <AppLingoProvider
          initialLocale={locale}
          initialTranslations={translations}
        >
          <AppProviders>{children}</AppProviders>
        </AppLingoProvider>
        <Script
          id="website-structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify(structuredData)}
        </Script>
        <Script
          src="https://track.pixmiller.com/script.js"
          data-website-id="9315890d-80ba-455a-b624-ab2ab48595f4"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
