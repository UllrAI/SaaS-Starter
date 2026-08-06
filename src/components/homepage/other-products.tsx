import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionContainer } from "@/components/layout/page-container";
import {
  ExternalLink,
  FileText,
  FlaskConical,
  Image,
  Sparkles,
  Square,
  TrendingUp,
  Zap,
} from "lucide-react";
export function OtherProducts({
  locale = SOURCE_LOCALE,
}: {
  locale?: SupportedLocale;
} = {}) {
  const { t } = getStaticTranslations(locale);
  const products = [
    {
      id: "pixmiller",
      name: "PixMiller",
      description: <>{t("home_ai_background_removal")}</>,
      url: "https://pixmiller.com/",
      icon: Image,
    },
    {
      id: "headshots-fun",
      name: "HeadShots.fun",
      description: <>{t("home_ai_headshots")}</>,
      url: "https://headshots.fun/",
      icon: Sparkles,
      badgeLabel: <>{t("home_open_source")}</>,
    },
    {
      id: "to-markdown",
      name: "To Markdown",
      description: <>{t("home_convert_docs_web_pages_into_markdown")}</>,
      url: "https://to-markdown.com/",
      icon: FileText,
    },
    {
      id: "trend-x-day",
      name: "Trend X Day",
      description: <>{t("home_product_creator_trends")}</>,
      url: "https://trendxday.com/",
      icon: TrendingUp,
    },
    {
      id: "ogimage-site",
      name: "OGimage.site",
      description: <>{t("home_generate_open_graph_images_social_cards")}</>,
      url: "https://ogimage.site/",
      icon: Square,
    },
    {
      id: "hipng",
      name: "HiPNG.com",
      description: <>{t("home_png_assets_mockups")}</>,
      url: "https://hipng.com/",
      icon: Zap,
    },
  ];
  return (
    <section className="bg-background border-border relative border-b py-24">
      <SectionContainer className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="border-primary text-primary mb-4">
            <FlaskConical className="mr-2 h-3 w-3" />
            <>{t("home_ullrai_lab")}</>
          </Badge>
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            <>{t("home_explore_rest_lab")}</>
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-8">
            <>{t("home_adjacent_products_same_team_each_focused")}</>
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 md:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {products.map((product) => {
            const IconComponent = product.icon;
            return (
              <Card
                key={product.id}
                className="group border-border bg-card hover:border-primary relative h-full border p-6 transition-all hover:shadow-[4px_4px_0px_0px_var(--border)]"
              >
                <CardContent className="p-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-secondary text-primary border-border group-hover:bg-primary group-hover:text-primary-foreground flex h-10 w-10 items-center justify-center border transition-colors">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-foreground font-bold">
                          {product.name}
                        </h3>
                        {product.badgeLabel && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {product.badgeLabel}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                  </div>

                  <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                    {product.description}
                  </p>

                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 z-10"
                    aria-label={t("other_product_visit", {
                      productName: product.name,
                    })}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-muted-foreground mt-10 text-center text-sm">
          <>{t("home_have_idea_another_tool")}</>
          <a
            href="mailto:support@ullrai.com"
            className="text-primary ml-2 font-bold hover:underline"
          >
            <>{t("home_let_us_know")}</>
          </a>
        </p>
      </SectionContainer>
    </section>
  );
}
