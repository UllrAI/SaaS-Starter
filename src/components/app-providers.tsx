"use client";

import { ThemeProvider } from "@/providers/theme-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/cookie-consent";
import { LocaleSwitcher } from "lingo.dev/react/client";
import { SUPPORTED_LOCALES } from "@/lib/config/i18n";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <NuqsAdapter>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <div className="fixed bottom-4 right-4 z-50">
          <LocaleSwitcher locales={[...SUPPORTED_LOCALES]} />
        </div>
        <NextTopLoader color="hsl(var(--primary))" showSpinner={false} />
        {children}
        <Toaster />
        <CookieConsent />
      </ThemeProvider>
    </NuqsAdapter>
  );
}
