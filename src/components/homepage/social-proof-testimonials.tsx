import { useTranslation } from "@/lib/i18n/translation/client";
import React from "react";
import { MessageSquareQuote, Star } from "lucide-react";
import { SectionContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
export function SocialProofUnified() {
  const { t } = useTranslation();
  const testimonials = [
    {
      id: "founder",
      quote: (
        <>
          {t(
            "f0902e42e5ac",
            "\u201CWe replaced two weeks of setup work with one focused weekend.The starter provided a solid foundation rather than another disposable prototype.\u201D",
          )}
        </>
      ),
      author: <>{t("640e279a6a32", "Avery Chen")}</>,
      role: <>{t("ee09bb134688", "Indie founder")}</>,
      highlight: (
        <>{t("9967a6c51fb9", "Preview copy for this demo section.")}</>
      ),
    },
    {
      id: "agency",
      quote: (
        <>
          {t(
            "7600368ed1a8",
            "\u201CSince auth and billing were already integrated, the team could focus on developing the product.\u201D",
          )}
        </>
      ),
      author: <>{t("5841973ca1b0", "Jordan Patel")}</>,
      role: <>{t("ceb39e179777", "Agency lead")}</>,
      highlight: <>{t("12d3e479ab69", "Demo feedback")}</>,
    },
    {
      id: "product",
      quote: (
        <>
          {t(
            "6e738cc53957",
            "\u201CWe retained the foundation, replaced the product logic, and progressed much faster than starting from scratch.\u201D",
          )}
        </>
      ),
      author: <>{t("e75ec808be8a", "Morgan Rivera")}</>,
      role: <>{t("c6db8f2ce550", "Product engineer")}</>,
      highlight: <>{t("386235f2e3d3", "Placeholder endorsement")}</>,
    },
  ];
  return (
    <section className="bg-muted/30 border-border relative overflow-hidden border-b py-24">
      <div className="from-primary/10 pointer-events-none absolute inset-x-0 top-0 h-32" />
      <SectionContainer>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="border-primary text-primary mb-4"
            >
              <MessageSquareQuote className="mr-2 h-3 w-3" />
              <>{t("66e31b40e488", "Demo social proof")}</>
            </Badge>

            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              <>{t("622e10b89685", "Trust by teams")}</>
            </h2>

            <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-8">
              <>
                {t(
                  "8332877c5884",
                  "The feedback should be replaced with verified customer testimonials before launch.",
                )}
              </>
            </p>
          </div>

          <Card className="border-border bg-background/80 backdrop-blur-sm">
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <MessageSquareQuote className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    <>{t("a1bbbcf59fd2", "Demo content notice")}</>
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    <>
                      {t(
                        "3b51c8369e5c",
                        "Keep the section and card rhythm, then swap in real names, logos, and short outcome-driven quotes when customer proof is available.",
                      )}
                    </>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.925fr)_minmax(0,0.925fr)]">
          {testimonials.map((testimonial, index) => (
            <Card
              key={testimonial.id}
              className={`border-border bg-card hover:border-primary/50 h-full border transition-colors ${index === 0 ? "lg:-translate-y-2" : ""}`}
            >
              <CardContent className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-primary flex items-center gap-1">
                    {Array.from({
                      length: 5,
                    }).map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className="h-4 w-4 fill-current"
                        aria-hidden="true"
                      />
                    ))}
                  </div>

                  <MessageSquareQuote
                    className="text-primary/20 h-8 w-8 shrink-0"
                    aria-hidden="true"
                  />
                </div>

                <p className="text-foreground mt-6 flex-1 text-base leading-7 sm:text-[1.05rem]">
                  {testimonial.quote}
                </p>

                <div className="border-border mt-6 border-t pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-foreground text-sm font-semibold">
                        {testimonial.author}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {testimonial.role}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      <>Demo</>
                    </Badge>
                  </div>

                  <p className="text-muted-foreground mt-3 text-sm leading-6">
                    {testimonial.highlight}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
