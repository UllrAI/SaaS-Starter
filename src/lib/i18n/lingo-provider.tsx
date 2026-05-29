"use client";

import type React from "react";
import { LingoProvider } from "@lingo.dev/compiler/react";

import type { LingoTranslations } from "@/lib/i18n/lingo-translations";
import type { SupportedLocale } from "@/lib/config/i18n";

export function AppLingoProvider({
  children,
  initialLocale,
  initialTranslations,
}: {
  children: React.ReactNode;
  initialLocale: SupportedLocale;
  initialTranslations: LingoTranslations;
}) {
  return (
    <LingoProvider
      initialLocale={initialLocale}
      initialTranslations={initialTranslations}
      devWidget={{ enabled: false }}
    >
      {children}
    </LingoProvider>
  );
}
