import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlogPostMetaProps {
  publishedDate?: string;
  featured?: boolean;
  tags?: string[];
  readTime?: string;
  author?: string;
  showBadge?: boolean;

  variant?: "overlay" | "default";
  className?: string;
}

export function BlogPostMeta({
  publishedDate,
  featured = false,
  tags = [],
  readTime,
  author,
  showBadge = true,

  variant = "default",
  className,
}: BlogPostMetaProps) {
  const isOverlay = variant === "overlay";
  const textColor = isOverlay ? "text-white/80" : "text-muted-foreground";
  const badgeVariant = featured ? "default" : "secondary";
  const isCenter = className?.includes("justify-center");

  const featuredBadgeClasses = isOverlay
    ? "bg-primary/90 text-primary-foreground border-primary/20 backdrop-blur-sm"
    : "bg-primary/10 text-primary border-primary/20";

  const articleBadgeClasses = isOverlay
    ? "bg-background/90 text-foreground border-border backdrop-blur-sm"
    : "bg-muted/50 text-muted-foreground border-muted";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Badge */}
      {showBadge && (
        <div
          className={cn(
            "flex items-center gap-2",
            isCenter && "justify-center",
          )}
        >
          {featured ? (
            <Badge
              variant={badgeVariant}
              className={cn(
                "hover:bg-primary/20 transition-colors",
                featuredBadgeClasses,
              )}
            >
              <Sparkles className="mr-1 h-3 w-3" />
              Featured
            </Badge>
          ) : (
            <Badge
              variant={badgeVariant}
              className={cn(
                "hover:bg-muted transition-colors",
                articleBadgeClasses,
              )}
            >
              Article
            </Badge>
          )}
        </div>
      )}

      {/* Meta info */}
      <div
        className={cn(
          "flex flex-col gap-2 sm:flex-row sm:gap-6",
          isCenter && "items-center justify-center",
        )}
      >
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 text-sm sm:gap-6",
            textColor,
            isCenter && "justify-center",
          )}
        >
          {publishedDate && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">
                {new Date(publishedDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="whitespace-nowrap">{readTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="whitespace-nowrap">{author}</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div
          className={cn("flex flex-wrap gap-2", isCenter && "justify-center")}
        >
          {tags.map((tag, index) => (
            <Badge
              key={index}
              variant="outline"
              className="hover:bg-primary/10 text-xs transition-colors"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
