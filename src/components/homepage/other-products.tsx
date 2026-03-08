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

interface Product {
  id: string;
  name: string;
  Description: React.ComponentType;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  BadgeLabel?: React.ComponentType;
}

const products: Product[] = [
  {
    id: "pixmiller",
    name: "PixMiller",
    Description: function ProductDescriptionPixMiller() {
      return <>Remove backgrounds in seconds with AI-assisted image cleanup.</>;
    },
    url: "https://pixmiller.com/",
    icon: Image,
  },
  {
    id: "headshots-fun",
    name: "HeadShots.fun",
    Description: function ProductDescriptionHeadshots() {
      return (
        <>
          Generate polished headshots for team profiles, resumes, and listings.
        </>
      );
    },
    url: "https://headshots.fun/",
    icon: Sparkles,
    BadgeLabel: function ProductBadgeOpenSource() {
      return <>Open Source</>;
    },
  },
  {
    id: "to-markdown",
    name: "To Markdown",
    Description: function ProductDescriptionToMarkdown() {
      return (
        <>Convert docs and web pages into Markdown you can actually edit.</>
      );
    },
    url: "https://to-markdown.com/",
    icon: FileText,
  },
  {
    id: "trend-x-day",
    name: "Trend X Day",
    Description: function ProductDescriptionTrendXDay() {
      return (
        <>
          Track daily product and creator trends with a simpler research loop.
        </>
      );
    },
    url: "https://trendxday.com/",
    icon: TrendingUp,
  },
  {
    id: "ogimage-site",
    name: "OGimage.site",
    Description: function ProductDescriptionOgImage() {
      return (
        <>Generate open graph images for social cards and link previews.</>
      );
    },
    url: "https://ogimage.site/",
    icon: Square,
  },
  {
    id: "hipng",
    name: "HiPNG.com",
    Description: function ProductDescriptionHiPNG() {
      return (
        <>Browse transparent PNG assets for quick mockups and landing pages.</>
      );
    },
    url: "https://hipng.com/",
    icon: Zap,
  },
];

export function OtherProducts() {
  return (
    <section className="bg-background border-border relative border-b py-24">
      <SectionContainer className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="border-primary text-primary mb-4">
            <FlaskConical className="mr-2 h-3 w-3" />
            <>UllrAI Lab</>
          </Badge>
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            <>Explore the rest of the lab</>
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-8">
            <>
              Adjacent products from the same team, each focused on a narrower
              workflow than the starter itself.
            </>
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 md:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {products.map((product) => {
            const IconComponent = product.icon;
            const Description = product.Description;
            const BadgeLabel = product.BadgeLabel;
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
                        {BadgeLabel && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            <BadgeLabel />
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                  </div>

                  <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                    <Description />
                  </p>

                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 z-10"
                    aria-label={`Visit ${product.name}`}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-muted-foreground mt-10 text-center text-sm">
          <>Have an idea for another tool?</>
          <a
            href="mailto:support@ullrai.com"
            className="text-primary ml-2 font-bold hover:underline"
          >
            <>Let us know</>
          </a>
        </p>
      </SectionContainer>
    </section>
  );
}
