import { resolveStaticMarketingParams } from "@/lib/i18n/static-marketing-locale";
import PagesLayout from "@/app/(pages)/layout";

export const dynamic = "force-dynamic";

export default async function LocalizedMarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await resolveStaticMarketingParams(params);

  return <PagesLayout>{children}</PagesLayout>;
}
