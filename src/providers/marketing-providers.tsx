"use client";

import type { ReactNode } from "react";

import { ThemeProvider } from "@/providers/theme-provider";

export function MarketingProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
