import { notFound } from "next/navigation";
import { createMetadata } from "@/lib/metadata";
import { BlogPostHeader } from "@/components/blog/blog-post-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { Languages } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getAllPostSlugs,
  getAuthorBySlug,
  getLocalizedBlogPath,
  getLocalizedBlogPostPath,
  getPostBySlug,
  getPostLocalizations,
} from "@/lib/content/blog";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getRequestLocale()]);
  const post = getPostBySlug(slug, locale);

  if (!post) {
    const metadata = createMetadata({});

    return {
      ...metadata,
      title: "Post Not Found",
      description: "The requested blog post could not be found.",
      openGraph: {
        ...metadata.openGraph,
        title: "Post Not Found",
        description: "The requested blog post could not be found.",
      },
      twitter: {
        ...metadata.twitter,
        title: "Post Not Found",
        description: "The requested blog post could not be found.",
      },
    };
  }

  const localizations = getPostLocalizations(slug);
  const languageAlternates = Object.fromEntries(
    localizations.map((localizedPost) => [
      localizedPost.locale,
      getLocalizedBlogPostPath(slug, localizedPost.locale),
    ]),
  );
  const description =
    post.excerpt ||
    `Read our comprehensive blog post about ${post.title}. Discover insights, tips, and best practices in this detailed article.`;
  const publishedTime = post.publishedDate
    ? new Date(post.publishedDate).toISOString()
    : undefined;
  const modifiedTime = publishedTime;

  return createMetadata({
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime,
      modifiedTime,
      images: post.heroImage
        ? [
            {
              url: post.heroImage,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.heroImage ? [post.heroImage] : undefined,
    },
    alternates: {
      canonical: getLocalizedBlogPostPath(slug, post.locale),
      languages: languageAlternates,
    },
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const [{ slug }, locale] = await Promise.all([params, getRequestLocale()]);
  const post = getPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  const author = getAuthorBySlug(post.author);

  return (
    <>
      <BlogPostHeader
        title={post.title}
        excerpt={post.excerpt || undefined}
        heroImage={post.heroImage || undefined}
        publishedDate={post.publishedDate || undefined}
        featured={post.featured}
        tags={post.tags ? [...post.tags] : undefined}
        content={post.content}
        author={author?.name}
        locale={locale}
        backHref={getLocalizedBlogPath(locale)}
      />

      {post.isFallback && (
        <section className="bg-background pt-8 sm:pt-10">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto max-w-4xl">
              <Alert className="border-amber-300/60 bg-amber-50/80 text-amber-950">
                <Languages className="text-amber-700" />
                <AlertTitle>
                  This article is currently only available in English
                </AlertTitle>
                <AlertDescription>
                  You are viewing the English version because a localized
                  version is not available yet.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </section>
      )}

      {/* Article Content */}
      <section className="bg-background py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <article className="prose prose-base prose-slate dark:prose-invert sm:prose-lg markdown-content mx-auto max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.content}
              </ReactMarkdown>
            </article>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="bg-muted/40 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-foreground mb-4 text-xl font-bold sm:text-2xl">
              Thanks for reading!
            </h2>
            <p className="text-muted-foreground mb-6 text-sm sm:mb-8 sm:text-base">
              Want to read more articles? Check out our blog for the latest
              insights and updates.
            </p>
            <Link href={getLocalizedBlogPath(locale)}>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
              >
                Explore More Articles
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
