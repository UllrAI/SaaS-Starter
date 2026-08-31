import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { Suspense } from "react";
import { PaymentStatusContent } from "./_components/payment-status-content";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SectionContainer } from "@/components/layout/page-container";
import { Clock } from "lucide-react";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
import { SITE_CONFIG } from "@/lib/config/site";
import { notFound } from "next/navigation";
function PaymentStatusSkeleton({ locale }: { locale: SupportedLocale }) {
  const { t } = getStaticTranslations(locale);
  return (
    <section className="bg-background flex min-h-screen items-center justify-center">
      <SectionContainer className="relative">
        {/* Status Badge Skeleton */}
        <div className="mb-8 text-center">
          <Badge
            variant="outline"
            className="border-border bg-background text-muted-foreground inline-flex items-center border px-3 py-1 text-sm"
          >
            <Clock className="mr-2 h-3 w-3" />
            {t("billing_loading_status")}
          </Badge>
        </div>

        <Card className="w-full text-center">
          <CardContent className="pt-6">
            <Skeleton className="mx-auto mb-6 h-16 w-16 rounded-full" />
            <Skeleton className="mx-auto mb-4 h-8 w-64" />
            <Skeleton className="mx-auto mb-8 h-4 w-80" />
            <Skeleton className="mx-auto mb-3 h-10 w-48" />
            <Skeleton className="mx-auto h-10 w-40" />
          </CardContent>
        </Card>
      </SectionContainer>
    </section>
  );
}
export default function PaymentStatusPage({
  locale = SOURCE_LOCALE,
}: {
  locale?: SupportedLocale;
} = {}) {
  if (!SITE_CONFIG.features.billing) {
    notFound();
  }

  return (
    <Suspense fallback={<PaymentStatusSkeleton locale={locale} />}>
      <PaymentStatusContent />
    </Suspense>
  );
}
