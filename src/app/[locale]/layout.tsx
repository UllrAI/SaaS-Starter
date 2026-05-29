import {
  getStaticMarketingLocaleParams,
  resolveStaticMarketingParams,
} from "@/lib/i18n/static-marketing-locale";
import { LocaleLingoProvider } from "@/lib/i18n/request-lingo-provider";
import PagesLayout from "@/app/(pages)/layout";

export const dynamicParams = false;
export const dynamic = "force-static";

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
  const locale = await resolveStaticMarketingParams(params);

  return (
    <LocaleLingoProvider locale={locale}>
      <script
        id="localized-document-lang"
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(locale)};`,
        }}
      />
      <PagesLayout>{children}</PagesLayout>
    </LocaleLingoProvider>
  );
}
