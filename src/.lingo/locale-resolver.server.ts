import { cookies, headers } from "next/headers";
import {
  LOCALE_COOKIE_NAME,
  LOCALE_HEADER_NAME,
  normalizeLocaleCandidate,
  resolvePreferredLocale,
} from "@/lib/config/i18n-routing";

export async function getServerLocale(): Promise<string> {
  const headerStore = await headers();
  const headerLocale = normalizeLocaleCandidate(
    headerStore.get(LOCALE_HEADER_NAME),
  );

  if (headerLocale) {
    return headerLocale;
  }

  const cookieStore = await cookies();
  return resolvePreferredLocale({
    cookieLocale: cookieStore.get(LOCALE_COOKIE_NAME)?.value,
    acceptLanguage: headerStore.get("accept-language"),
  });
}
