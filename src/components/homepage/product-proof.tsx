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
      title: t("productProofSourceTitle", "Inspect the source"),
      description: t(
        "productProofSourceDescription",
        "Review the real routes, migrations, tests, and deployment files before you adopt the starter.",
      ),
    },
    {
      id: "workflows",
      icon: CheckCircle2,
      title: t("productProofWorkflowsTitle", "Complete workflows"),
      description: t(
        "productProofWorkflowsDescription",
        "Authentication, billing, uploads, admin operations, API keys, and CLI device auth are connected end to end.",
      ),
    },
    {
      id: "verification",
      icon: TestTube2,
      title: t("productProofVerificationTitle", "Verification included"),
      description: t(
        "productProofVerificationDescription",
        "Unit, route, integration, and browser smoke checks protect the foundations you are most likely to extend.",
      ),
    },
  ];

  return (
    <section className="bg-muted/30 border-border border-b py-20 sm:py-24">
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <div className="max-w-xl">
            <Badge variant="outline" className="border-primary text-primary">
              {t("productProofBadge", "Verifiable foundations")}
            </Badge>
            <h2 className="text-foreground mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("productProofTitle", "Proof lives in the repository")}
            </h2>
            <p className="text-muted-foreground mt-5 text-lg leading-8">
              {t(
                "productProofDescription",
                "No invented customer logos or placeholder endorsements. Evaluate the implementation, run the checks, and keep only what your product needs.",
              )}
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="text-primary mt-6 inline-flex items-center gap-2 text-sm font-semibold hover:underline"
            >
              {t("productProofSourceLink", "Review the GitHub repository")}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {proofPoints.map((point) => {
              const Icon = point.icon;
              return (
                <Card key={point.id} className="h-full">
                  <CardContent className="pt-6">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
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
