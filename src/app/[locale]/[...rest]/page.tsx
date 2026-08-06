import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { resolveStaticMarketingParams } from "@/lib/i18n/static-marketing-locale";
import { getStaticTranslations } from "@/lib/i18n/translation/static";

type LocalizedCatchAllProps = {
  params: Promise<{
    locale: string;
    rest: string[];
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedCatchAllProps): Promise<Metadata> {
  const locale = await resolveStaticMarketingParams(params);
  const { t } = getStaticTranslations(locale);

  return {
    title: t("common_page_not_found"),
    description: t("common_page_youre_looking_doesnt_exist_has"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function LocalizedCatchAll({
  params,
}: LocalizedCatchAllProps) {
  await resolveStaticMarketingParams(params);
  notFound();
}
