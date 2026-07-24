import PaymentStatusLayout, {
  buildPaymentStatusMetadata,
} from "@/app/(pages)/payment-status/layout";
import { withStaticLocalizedMetadata } from "@/lib/i18n/static-marketing-metadata";
import { resolveStaticMarketingParams } from "@/lib/i18n/static-marketing-locale";

type LocalizedLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Omit<LocalizedLayoutProps, "children">) {
  const locale = await resolveStaticMarketingParams(params);
  const metadata = await buildPaymentStatusMetadata(locale);
  return withStaticLocalizedMetadata(metadata, "/payment-status", locale);
}

export default async function LocalizedPaymentStatusLayout({
  children,
  params,
}: LocalizedLayoutProps) {
  await resolveStaticMarketingParams(params);
  return <PaymentStatusLayout>{children}</PaymentStatusLayout>;
}
