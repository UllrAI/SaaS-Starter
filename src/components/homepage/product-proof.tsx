import { CheckCircle2, ExternalLink, Github, TestTube2 } from "lucide-react";

import { SectionContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GITHUB_URL } from "@/lib/config/constants";
import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";

export function ProductProof({
  locale = SOURCE_LOCALE,
}: {
  locale?: SupportedLocale;
} = {}) {
  const { t } = getStaticTranslations(locale);
  const proofPoints = [
    {
      id: "source",
      icon: Github,
      title: t("product_proof_source_title"),
      description: t("product_proof_source_description"),
    },
    {
      id: "workflows",
      icon: CheckCircle2,
      title: t("product_proof_workflows_title"),
      description: t("product_proof_workflows_description"),
    },
    {
      id: "verification",
      icon: TestTube2,
      title: t("product_proof_verification_title"),
      description: t("product_proof_verification_description"),
    },
  ];

  return (
    <section className="bg-muted/30 border-border border-b py-20 sm:py-24">
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <div className="max-w-xl">
            <Badge variant="outline" className="border-primary text-primary">
              {t("product_proof_badge")}
            </Badge>
            <h2 className="text-foreground mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("product_proof_title")}
            </h2>
            <p className="text-muted-foreground mt-5 text-lg leading-8">
              {t("product_proof_description")}
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              data-umami-event="github_source_click"
              data-umami-event-source="homepage_proof"
              className="text-primary mt-6 inline-flex items-center gap-2 text-sm font-semibold hover:underline"
            >
              {t("product_proof_source_link")}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {proofPoints.map((point) => {
              const Icon = point.icon;
              return (
                <Card key={point.id} className="h-full">
                  <CardContent className="pt-6">
                    <div className="text-primary flex h-10 w-10 items-center">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-foreground mt-5 font-semibold">
                      {point.title}
                    </h3>
                    <p className="text-muted-foreground mt-3 text-sm leading-6">
                      {point.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
