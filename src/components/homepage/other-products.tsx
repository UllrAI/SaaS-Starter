"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  Image,
  Zap,
  FileText,
  TrendingUp,
  Square,
  Sparkles,
} from "lucide-react";

interface Product {
  name: string;
  description: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const products: Product[] = [
  {
    name: "PixMiller",
    description:
      "Remove backgrounds in seconds with AI precision - no design skills needed",
    url: "https://pixmiller.com/",
    icon: Image,
  },
  {
    name: "HeadShots.fun",
    description:
      "Generate professional headshots instantly - perfect for LinkedIn, resumes & more",
    url: "https://headshots.fun/",
    icon: Sparkles,
    badge: "Open Source",
  },
  {
    name: "To Markdown",
    description:
      "Convert any document to clean Markdown instantly - PDFs, Word docs, web pages",
    url: "https://to-markdown.com/",
    icon: FileText,
  },
  {
    name: "Trend X Day",
    description:
      "Stay ahead with daily insights - data-driven analysis of global trends",
    url: "https://trendxday.com/",
    icon: TrendingUp,
  },
  {
    name: "OGimage.site",
    description:
      "Create stunning social media cards that boost engagement and clicks",
    url: "https://ogimage.site/",
    icon: Square,
  },
  {
    name: "HiPNG.com",
    description:
      "Access thousands of AI-generated transparent PNGs - perfect for any project",
    url: "https://hipng.com/",
    icon: Zap,
  },
];

export function OtherProducts() {
  return (
    <section className="bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            More Tools From UllrAI Lab
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-8">
            Explore our collection of AI-powered tools that help creators,
            developers, and businesses work smarter
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 md:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {products.map((product) => {
            const IconComponent = product.icon;
            return (
              <Card
                key={product.name}
                className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-foreground group-hover:text-primary font-semibold transition-colors">
                          {product.name}
                        </h3>
                        {product.badge && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {product.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="text-muted-foreground h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>

                  <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                    {product.description}
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
      </div>
    </section>
  );
}
