"use client";

import { useLingoContext } from "@lingo.dev/compiler/react";
import { resolveIntlLocale } from "@/lib/locale";

export function useIntlLocale(): string {
  const { locale } = useLingoContext();
  return resolveIntlLocale(locale);
}
