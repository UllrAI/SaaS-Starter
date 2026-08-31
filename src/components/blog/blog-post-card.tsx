import { getStaticTranslations } from "@/lib/i18n/translation/static";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { BlogPostMeta } from "./blog-post-meta";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
interface BlogPostCardProps {
  slug: string;
  href?: string;
  title: string;
  excerpt?: string;
  heroImage?: string;
  publishedDate?: string;
  featured?: boolean;
  variant?: "featured" | "regular";
  className?: string;
  author?: ReactNode;
  readingMinutes?: number;
  locale?: SupportedLocale;
}
export function BlogPostCard({
  slug,
  href,
  title,
  excerpt,
  heroImage,
  publishedDate,
  featured = false,
  variant = "regular",
  className,
  author,
  readingMinutes,
  locale,
}: BlogPostCardProps) {
  const { t } = getStaticTranslations(locale ?? SOURCE_LOCALE);
  const postHref = href ?? `/blog/${slug}`;
  const isFeatured = variant === "featured";
  const hasImage = !!heroImage;
  const cardClasses = cn(
    "group overflow-hidden transition-colors duration-200",
    isFeatured
      ? "bg-background border-primary border-2"
      : "border-border bg-background hover:border-primary",
    className,
  );
  const imageHeight = isFeatured ? "h-64 lg:h-80" : "h-48";
  const titleSize = isFeatured ? "text-2xl lg:text-3xl" : "text-xl lg:text-2xl";
  const readMoreText = isFeatured
    ? t("blog_read_full_article")
    : t("blog_read_article");
  const defaultExcerpt = t("blog_default_excerpt");
  return (
    <Card className={cardClasses}>
      {/* Hero Image */}
      {hasImage && (
        <div className={cn("relative -mt-6 overflow-hidden", imageHeight)}>
          <Image
            src={heroImage}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

          {/* Badge overlay */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
            {featured ? (
              <Badge
                variant="default"
                className="bg-primary text-primary-foreground border-primary"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                {t("blog_featured")}
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-background text-foreground border-border"
              >
                {t("blog_article")}
              </Badge>
            )}
          </div>
        </div>
      )}

      <CardHeader>
        {/* Badge for non-image posts */}
        {!hasImage && (
          <div className="mb-4 flex justify-end">
            {featured ? (
              <Badge
                variant="default"
                className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                {t("blog_featured")}
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-muted/50 text-muted-foreground border-muted hover:bg-muted transition-colors"
              >
                {t("blog_article")}
              </Badge>
            )}
          </div>
        )}

        <div className="space-y-3">
          <CardTitle className={titleSize}>
            <Link
              href={postHref}
              className="group-hover:text-primary line-clamp-2 transition-colors duration-200"
            >
              {title}
            </Link>
          </CardTitle>

          {/* Meta information */}
          <BlogPostMeta
            publishedDate={publishedDate}
            featured={false}
            tags={[]} // Don't show tags in card, only show date/time/author
            showBadge={false} // Don't show badge here as it's already shown above
            className="justify-start"
            author={author}
            readingMinutes={readingMinutes}
            locale={locale}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription
          className={cn(
            "line-clamp-3 leading-relaxed",
            isFeatured ? "mb-6 text-base" : "mb-4 text-base",
          )}
        >
          {excerpt || defaultExcerpt}
        </CardDescription>

        <Link
          href={postHref}
          className="text-primary hover:text-primary/80 inline-flex items-center gap-2 font-medium underline-offset-4 hover:underline"
        >
          {readMoreText}
          <span translate="no">→</span>
        </Link>
      </CardContent>
    </Card>
  );
}
