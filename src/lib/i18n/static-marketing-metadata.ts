import type { Metadata } from "next";

import type { SupportedLocale } from "@/lib/config/i18n";
import { createLocalizedAlternates } from "@/lib/metadata";

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
        }
      : metadata.openGraph,
  };
}
