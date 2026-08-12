import { Inter, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import env from "@/env";
import { SignupSuccessTracker } from "@/components/analytics/signup-success-tracker";

import { AppIntlProvider } from "@/lib/i18n/provider";
import type { AppMessages } from "@/lib/i18n/messages";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/config/i18n";
import {
  APP_NAME,
  COMPANY_NAME,
  OGIMAGE,
  TWITTERACCOUNT,
} from "@/lib/config/constants";
import { getServerTranslations } from "@/lib/i18n/translation/server";
import { absoluteUrl, APP_ORIGIN } from "@/lib/url";
import "@/styles/globals.css";

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

export async function createRootMetadata(
  locale: SupportedLocale,
): Promise<Metadata> {
  const { t } = await getServerTranslations({ locale });
  const description = t("common_complete_micro_ullrai_saas");
  const openGraphLocale = locale === "zh-Hans" ? "zh_CN" : "en_US";

  return {
    metadataBase: new URL(APP_ORIGIN),
    applicationName: APP_NAME,
    authors: [{ name: COMPANY_NAME, url: APP_ORIGIN }],
    creator: COMPANY_NAME,
    publisher: COMPANY_NAME,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/icon-192.png",
    },
    title: {
      template: `%s | ${APP_NAME}`,
      default: APP_NAME,
    },
    description,
    openGraph: {
      title: APP_NAME,
      description,
      images: [
        {
          url: OGIMAGE,
          width: 1480,
          height: 777,
          alt: APP_NAME,
        },
      ],
      locale: openGraphLocale,
      siteName: APP_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      creator: TWITTERACCOUNT,
      title: APP_NAME,
      description,
      images: [{ url: OGIMAGE, width: 1480, height: 777, alt: APP_NAME }],
    },
    verification: env.BING_SITE_VERIFICATION
      ? {
          other: {
            "msvalidate.01": env.BING_SITE_VERIFICATION,
          },
        }
      : undefined,
  };
}

export function AppDocument({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: SupportedLocale;
  messages: AppMessages;
}) {
  const umamiEnabled = Boolean(
    env.NEXT_PUBLIC_UMAMI_SCRIPT_URL &&
    env.NEXT_PUBLIC_UMAMI_WEBSITE_ID &&
    env.NEXT_PUBLIC_UMAMI_DOMAINS,
  );
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": absoluteUrl("/#organization"),
        name: COMPANY_NAME,
        url: APP_ORIGIN,
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/icon-512.png"),
          width: 512,
          height: 512,
        },
      },
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        name: APP_NAME,
        url: APP_ORIGIN,
        publisher: {
          "@id": absoluteUrl("/#organization"),
        },
        inLanguage: SUPPORTED_LOCALES,
      },
    ],
  };

  return (
    <html
      lang={locale}
      className={`${fontSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <AppIntlProvider locale={locale} messages={messages}>
          {children}
        </AppIntlProvider>
        <script
          id="website-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        {umamiEnabled && (
          <Script
            id="umami-tracker"
            src={env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
            data-website-id={env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            data-domains={env.NEXT_PUBLIC_UMAMI_DOMAINS}
            data-do-not-track="true"
            data-exclude-search="true"
            strategy="afterInteractive"
          />
        )}
        {umamiEnabled && <SignupSuccessTracker />}
      </body>
    </html>
  );
}
