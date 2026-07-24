import { APP_NAME, OGIMAGE, TWITTERACCOUNT } from "@/lib/config/constants";
import {
  SOURCE_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/config/i18n";
import { withLocalePrefix } from "@/lib/config/i18n-routing";
import env from "@/env";
import type { Metadata } from "next";

type WithoutLocalizableMetadata<T> = T extends unknown
  ? Omit<T, "title" | "description">
  : never;

type SharedOpenGraphMetadata = WithoutLocalizableMetadata<
  NonNullable<Metadata["openGraph"]>
>;

type SharedTwitterMetadata = WithoutLocalizableMetadata<
  NonNullable<Metadata["twitter"]>
>;

type MetadataDefaultsOptions = Pick<
  Metadata,
  "alternates" | "metadataBase" | "robots"
> & {
  locale?: SupportedLocale;
  openGraph?: SharedOpenGraphMetadata;
  twitter?: SharedTwitterMetadata;
};

export function getOpenGraphLocale(locale: SupportedLocale): string {
  return locale === "zh-Hans" ? "zh_CN" : "en_US";
}

function resolveCanonicalUrl(
  alternates: Metadata["alternates"],
): string | URL | undefined {
  const canonical = alternates?.canonical;

  if (canonical instanceof URL || typeof canonical === "string") {
    return canonical;
  }

  return undefined;
}

export function createMetadataDefaults(
  options: MetadataDefaultsOptions = {},
): Metadata {
  const canonicalUrl = resolveCanonicalUrl(options.alternates);
  const locale = options.locale ?? SOURCE_LOCALE;
  const alternateLocale = SUPPORTED_LOCALES.filter(
    (supportedLocale) => supportedLocale !== locale,
  ).map(getOpenGraphLocale);
  const socialImage = {
    url: OGIMAGE,
    width: 1480,
    height: 777,
    alt: APP_NAME,
  };

  return {
    alternates: options.alternates,
    robots: options.robots,
    openGraph: {
      url: options.openGraph?.url ?? canonicalUrl,
      images: options.openGraph?.images ?? [socialImage],
      locale: getOpenGraphLocale(locale),
      alternateLocale,
      siteName: APP_NAME,
      type: "website",
      ...options.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      creator: TWITTERACCOUNT,
      images: options.twitter?.images ?? [socialImage],
      ...options.twitter,
    },
    metadataBase: options.metadataBase ?? new URL(env.NEXT_PUBLIC_APP_URL),
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
