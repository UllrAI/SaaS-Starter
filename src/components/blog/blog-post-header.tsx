import { Button } from "@/components/ui/button";
import { BackgroundPattern } from "@/components/ui/background-pattern";
import { Badge } from "@/components/ui/badge";
import { BlogPostMeta } from "./blog-post-meta";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { calculateReadingTime } from "@/lib/utils";

interface BlogPostHeaderProps {
  title: string;
  excerpt?: string;
  heroImage?: string;
  publishedDate?: string;
  featured?: boolean;
  tags?: string[];
  backHref?: string;
  backText?: string;
  author?: string;
  content: string;
}

export function BlogPostHeader({
  title,
  excerpt,
  heroImage,
  publishedDate,
  featured = false,
  tags = [],
  backHref = "/blog",
  backText = "Back to Blog",
  author,
  content,
}: BlogPostHeaderProps) {
  const hasImage = !!heroImage;

  if (hasImage) {
    return (
      <>
        {/* Hero Image Layout */}
        <section className="bg-background relative overflow-hidden">
          <div className="relative h-[50vh] overflow-hidden lg:h-[60vh]">
            <Image
              src={heroImage}
              alt={title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Back button overlay */}
            <div className="absolute top-4 left-4 z-10 sm:top-6 sm:left-6">
              <Button
                variant="ghost"
                asChild
                className="bg-background/80 hover:bg-background/90 backdrop-blur-sm transition-colors"
              >
                <Link href={backHref}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{backText}</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </Button>
            </div>

            {/* Article header overlay */}
            <div className="absolute right-0 bottom-0 left-0 p-4 sm:p-6 lg:p-12">
              <div className="mx-auto max-w-4xl text-center">
                <BlogPostMeta
                  publishedDate={publishedDate}
                  featured={featured}
                  variant="overlay"
                  className="mb-6 justify-center"
                  showBadge={true}
                  author={author}
                  readTime={calculateReadingTime(content)}
                />

                <h1 className="mb-4 text-2xl font-bold tracking-tight text-white drop-shadow-lg sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
                  {title}
                </h1>

                {excerpt && (
                  <p className="mx-auto mb-6 max-w-3xl text-sm leading-relaxed text-white/90 drop-shadow sm:text-xl">
                    {excerpt}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Tags section for hero image layout */}
        {tags.length > 0 && (
          <section className="bg-background/50 py-6 sm:py-8">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="mx-auto max-w-4xl">
                <div className="flex flex-wrap justify-center gap-2">
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
              </div>
            </div>
          </section>
        )}
      </>
    );
  }

  // Non-hero image layout
  return (
    <section className="bg-background relative overflow-hidden">
      <BackgroundPattern />

      <div className="py-6 md:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            {/* Back button */}
            <div className="mb-6 sm:mb-8">
              <Button
                variant="ghost"
                asChild
                className="hover:bg-background/80 pl-0 transition-colors"
              >
                <Link href={backHref}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{backText}</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </Button>
            </div>

            {/* Article header */}
            <header className="text-center">
              <BlogPostMeta
                publishedDate={publishedDate}
                featured={featured}
                className="mb-6 justify-center sm:mb-8"
                showBadge={true}
                author={author}
                readTime={calculateReadingTime(content)}
              />

              <h1 className="text-foreground mb-6 text-3xl font-bold tracking-tight sm:mb-8 sm:text-4xl lg:text-5xl xl:text-6xl">
                {title}
              </h1>

              {excerpt && (
                <p className="text-muted-foreground mx-auto mb-6 max-w-3xl text-lg leading-relaxed sm:mb-8 sm:text-xl">
                  {excerpt}
                </p>
              )}

              {/* Tags section */}
              {tags.length > 0 && (
                <div className="mt-6 sm:mt-8">
                  <div className="flex flex-wrap justify-center gap-2">
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
                </div>
              )}
            </header>
          </div>
        </div>
      </div>
    </section>
  );
}
