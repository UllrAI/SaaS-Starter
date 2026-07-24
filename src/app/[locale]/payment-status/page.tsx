import PaymentStatusPage from "@/app/(pages)/payment-status/page";
import { resolveStaticMarketingParams } from "@/lib/i18n/static-marketing-locale";

export default async function LocalizedPaymentStatusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveStaticMarketingParams(params);
  return <PaymentStatusPage locale={locale} />;
}
