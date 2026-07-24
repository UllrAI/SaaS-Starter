"use client";

import { useLocale } from "next-intl";
import { resolveIntlLocale } from "@/lib/locale";

export function useIntlLocale(): string {
  return resolveIntlLocale(useLocale());
}
