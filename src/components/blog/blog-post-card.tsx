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
import { cn, calculateReadingTime } from "@/lib/utils";

interface BlogPostCardProps {
  slug: string;
  title: string;
  excerpt?: string;
  heroImage?: string;
  publishedDate?: string;
  featured?: boolean;
  variant?: "featured" | "regular";
  className?: string;
  author?: string;
  content: string;
}

export function BlogPostCard({
  slug,
  title,
  excerpt,
  heroImage,
  publishedDate,
  featured = false,
  variant = "regular",
  className,
  author,
  content,
}: BlogPostCardProps) {
  const isFeatured = variant === "featured";
  const hasImage = !!heroImage;

  const cardClasses = cn(
    "group overflow-hidden backdrop-blur-sm transition-all duration-300",
    isFeatured
      ? "bg-background/50 hover:bg-background/80 border-primary/20 border hover:shadow-xl"
      : "border-border bg-background/50 hover:bg-background/80 hover:shadow-lg",
    className,
  );

  const imageHeight = isFeatured ? "h-64 lg:h-80" : "h-48";
  const titleSize = isFeatured ? "text-2xl lg:text-3xl" : "text-xl lg:text-2xl";
  const readMoreText = isFeatured ? "Read full article" : "Read article";

  const defaultExcerpt =
    "Discover the latest insights and updates in this comprehensive article. Click to read the full content and learn more about this topic.";

  return (
    <Card className={cardClasses}>
      {/* Hero Image */}
      {hasImage && (
        <div className={cn("relative -mt-6 overflow-hidden", imageHeight)}>
          <Image
            src={heroImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Badge overlay */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
            {featured ? (
              <Badge
                variant="default"
                className="bg-primary/90 text-primary-foreground border-primary/20 hover:bg-primary backdrop-blur-sm transition-colors"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                Featured
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-background/90 text-foreground border-border hover:bg-background backdrop-blur-sm transition-colors"
              >
                Article
              </Badge>
            )}
          </div>
        </div>
      )}

      <CardHeader className="pb-4">
        {/* Badge for non-image posts */}
        {!hasImage && (
          <div className="mb-4 flex justify-end">
            {featured ? (
              <Badge
                variant="default"
                className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                Featured
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-muted/50 text-muted-foreground border-muted hover:bg-muted transition-colors"
              >
                Article
              </Badge>
            )}
          </div>
        )}

        <div className="space-y-3">
          <CardTitle className={titleSize}>
            <Link
              href={`/blog/${slug}`}
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
            readTime={calculateReadingTime(content)}
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
          href={`/blog/${slug}`}
          className="text-primary hover:text-primary/80 inline-flex items-center gap-2 font-medium transition-all duration-200 group-hover:gap-3"
        >
          {readMoreText}
          <span
            className="transition-transform group-hover:translate-x-1"
            data-lingo-skip
          >
            →
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}
