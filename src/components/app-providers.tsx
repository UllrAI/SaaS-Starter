"use client";

import { ThemeProvider } from "@/providers/theme-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/components/ui/sonner";

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
        <NextTopLoader color="hsl(var(--primary))" showSpinner={false} />
        {children}
        <Toaster />
      </ThemeProvider>
    </NuqsAdapter>
  );
}
