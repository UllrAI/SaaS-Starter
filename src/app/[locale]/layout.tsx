import { Header } from "@/components/homepage/header";
import { Footer } from "@/components/homepage/footer";
import { Suspense } from "react";
import {
  getStaticMarketingLocaleParams,
  resolveStaticMarketingParams,
} from "@/lib/i18n/static-marketing-locale";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getStaticMarketingLocaleParams();
}

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await resolveStaticMarketingParams(params);

  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-16 w-full" />}>
        <Header />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
