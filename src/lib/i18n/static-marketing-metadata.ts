import type { Metadata } from "next";

import type { SupportedLocale } from "@/lib/config/i18n";
import { createLocalizedAlternates } from "@/lib/metadata";
import { getOpenGraphLocale } from "@/lib/metadata";
import { SUPPORTED_LOCALES } from "@/lib/config/i18n";

function getCanonicalUrl(
  alternates: Metadata["alternates"],
): string | URL | undefined {
  const canonical = alternates?.canonical;

  if (canonical instanceof URL || typeof canonical === "string") {
    return canonical;
  }

  return undefined;
}

export function withStaticLocalizedMetadata(
  metadata: Metadata,
  pathname: string,
  locale: SupportedLocale,
): Metadata {
  const alternates = createLocalizedAlternates(pathname, locale);
  const canonicalUrl = getCanonicalUrl(alternates);

  return {
    ...metadata,
    alternates,
    openGraph: metadata.openGraph
      ? {
          ...metadata.openGraph,
          url: canonicalUrl,
          locale: getOpenGraphLocale(locale),
          alternateLocale: SUPPORTED_LOCALES.filter(
            (supportedLocale) => supportedLocale !== locale,
          ).map(getOpenGraphLocale),
        }
      : metadata.openGraph,
  };
}
