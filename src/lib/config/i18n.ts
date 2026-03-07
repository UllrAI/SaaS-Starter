export const SUPPORTED_LOCALES = ["en", "zh-Hans"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type LocaleDisplayInfo = {
  nativeName: string;
};

export const SOURCE_LOCALE = "en" as const;
export const DEFAULT_INTL_LOCALE = "en-US" as const;
export const INTL_LOCALE_BY_SUPPORTED_LOCALE: Record<SupportedLocale, string> = {
  en: DEFAULT_INTL_LOCALE,
  "zh-Hans": "zh-CN",
};

export const TARGET_LOCALES = SUPPORTED_LOCALES.filter(
  (locale) => locale !== SOURCE_LOCALE,
);

const localeNativeNameCache = new Map<string, string>();

function getLocaleNativeName(locale: string): string {
  const cachedName = localeNativeNameCache.get(locale);
  if (cachedName) {
    return cachedName;
  }

  const normalized = locale.trim().replace(/_/g, "-");
  let nativeName: string;

  if (!normalized) {
    nativeName = locale.toUpperCase();
  } else {
    try {
      const [canonicalLocale] = Intl.getCanonicalLocales(normalized);
      const displayNames = new Intl.DisplayNames([canonicalLocale], {
        type: "language",
      });

      nativeName = displayNames.of(canonicalLocale) ?? canonicalLocale.toUpperCase();
    } catch {
      nativeName = normalized.toUpperCase();
    }
  }

  localeNativeNameCache.set(locale, nativeName);
  return nativeName;
}

export function getLocaleDisplayInfo(locale: string): LocaleDisplayInfo {
  return {
    nativeName: getLocaleNativeName(locale),
  };
}

// export const LINGO_DEFAULT_MODEL = "openrouter:google/gemini-3-flash-preview";
export const LINGO_DEFAULT_MODEL = "openrouter:stepfun/step-3.5-flash";

export const LINGO_MODEL_MAP: Record<string, string> = {
  "*:*": LINGO_DEFAULT_MODEL,
};

export const LINGO_PLURALIZATION_MODEL = LINGO_DEFAULT_MODEL;
