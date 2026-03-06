import "@/styles/globals.css";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import { APP_NAME, COMPANY_NAME } from "@/lib/config/constants";
import env from "@/env";

import { LingoProvider } from "@lingo.dev/compiler/react/next";
import { AppProviders } from "@/components/app-providers";
import { createPageMetadata } from "@/lib/i18n/page-metadata";
import { getRequestLocale } from "@/lib/i18n/server-locale";

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

async function RootMetadataDescription() {
  return (
    <>
      Complete Micro UllrAI SaaS starter with authentication, payments,
      database, and deployment.
    </>
  );
}

export async function generateMetadata() {
  return createPageMetadata({
    title: {
      template: `%s | ${APP_NAME}`,
      default: APP_NAME,
    },
    description: RootMetadataDescription,
    applicationName: APP_NAME,
    authors: [{ name: COMPANY_NAME, url: env.NEXT_PUBLIC_APP_URL }],
    creator: COMPANY_NAME,
    publisher: COMPANY_NAME,
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
    alternates: {
      canonical: env.NEXT_PUBLIC_APP_URL,
    },
  });
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html
      lang={locale}
      className={`${fontSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <head />
      <body>
        <LingoProvider initialLocale={locale} devWidget={{ enabled: false }}>
          <AppProviders>{children}</AppProviders>
        </LingoProvider>
        <Script
          src="https://track.pixmiller.com/script.js"
          data-website-id="9315890d-80ba-455a-b624-ab2ab48595f4"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
