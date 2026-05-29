import {
  getStaticMarketingLocaleParams,
  resolveStaticMarketingParams,
} from "@/lib/i18n/static-marketing-locale";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getStaticMarketingLocaleParams();
}

export default async function LocalizedMarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await resolveStaticMarketingParams(params);

  return children;
}
