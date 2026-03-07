import { APP_NAME, OGIMAGE, TWITTERACCOUNT } from "@/lib/config/constants";
import { SOURCE_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/config/i18n";
import { withLocalePrefix } from "@/lib/config/i18n-routing";
import env from "@/env";
import type { Metadata } from "next";

function resolveCanonicalUrl(override: Metadata): string | URL | undefined {
  const canonical = override.alternates?.canonical;

  if (canonical instanceof URL || typeof canonical === "string") {
    return canonical;
  }

  return undefined;
}

export function createMetadata(override: Metadata): Metadata {
  let title = APP_NAME;

  if (override.title) {
    if (typeof override.title === "string") {
      title = override.title;
    } else if (typeof override.title === "object" && override.title !== null) {
      const titleObj = override.title as Record<
        string,
        string | null | undefined
      >;
      title = titleObj.absolute || titleObj.default || APP_NAME;
    }
  }

  const description = override.description || "";
  const canonicalUrl = resolveCanonicalUrl(override);

  return {
    ...override,
    openGraph: {
      title: override.openGraph?.title ?? title,
      description: override.openGraph?.description ?? description,
      url: override.openGraph?.url ?? canonicalUrl,
      images: override.openGraph?.images ?? OGIMAGE,
      siteName: APP_NAME,
      type: "website",
      ...override.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      creator: TWITTERACCOUNT,
      title: override.twitter?.title ?? title,
      description: override.twitter?.description ?? description,
      images: override.twitter?.images ?? OGIMAGE,
      ...override.twitter,
    },
    metadataBase: override.metadataBase ?? new URL(env.NEXT_PUBLIC_APP_URL),
  };
}

export function createLocalizedAlternates(
  pathname: string,
  locale: SupportedLocale,
  locales: readonly SupportedLocale[] = SUPPORTED_LOCALES,
): NonNullable<Metadata["alternates"]> {
  const canonical = withLocalePrefix(pathname, locale);
  const languages = Object.fromEntries(
    locales.map((supportedLocale) => [
      supportedLocale,
      withLocalePrefix(pathname, supportedLocale),
    ]),
  );

  return {
    canonical,
    languages: {
      ...languages,
      "x-default": withLocalePrefix(pathname, SOURCE_LOCALE),
    },
  };
}
