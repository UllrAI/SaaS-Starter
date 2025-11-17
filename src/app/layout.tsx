import "@/styles/globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { createMetadata } from "@/lib/metadata";
import {
  APP_NAME,
  APP_DESCRIPTION,
  COMPANY_NAME,
} from "@/lib/config/constants";
import env from "@/env";

import NextTopLoader from "nextjs-toploader";
import { CookieConsent } from "@/components/cookie-consent";

export const metadata = createMetadata({
  title: {
    template: `%s | ${APP_NAME}`,
    default: `${APP_NAME} - ${APP_DESCRIPTION}`,
  },
  description: APP_DESCRIPTION,
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
  // themeColor: [], // Will add later if specific theme colors are defined
  // manifest: "/manifest.json", // Will add later if PWA is implemented
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>
        <NuqsAdapter>
          <ThemeProvider
            attribute={"class"}
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <NextTopLoader color="hsl(var(--primary))" showSpinner={false} />
            {children}
            <Toaster />
            <CookieConsent />
          </ThemeProvider>
        </NuqsAdapter>
        <Script
          src="https://track.pixmiller.com/script.js"
          data-website-id="9315890d-80ba-455a-b624-ab2ab48595f4"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
