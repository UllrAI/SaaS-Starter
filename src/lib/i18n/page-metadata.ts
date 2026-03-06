import "server-only";

import type { Metadata } from "next";
import type { SupportedLocale } from "@/lib/config/i18n";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { createMetadata } from "@/lib/metadata";

type LocalizedMetadataInput = Record<SupportedLocale, Metadata>;

export async function createLocalizedMetadata(
  localizedMetadata: LocalizedMetadataInput,
): Promise<Metadata> {
  const locale = await getRequestLocale();

  return createMetadata(localizedMetadata[locale] ?? localizedMetadata.en);
}
