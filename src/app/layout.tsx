import "@/styles/globals.css";
import Script from "next/script";
import { createMetadata } from "@/lib/metadata";
import { APP_NAME, COMPANY_NAME } from "@/lib/config/constants";
import env from "@/env";

import { LingoProvider } from "@lingo.dev/compiler/react/next";
import { AppProviders } from "@/components/app-providers";

export const metadata = createMetadata({
  title: {
    template: `%s | ${APP_NAME}`,
    default: `${APP_NAME}`,
  },
  description:
    "Complete Micro UllrAI SaaS starter with authentication, payments, database, and deployment.",
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
        <LingoProvider devWidget={{ enabled: false }}>
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
