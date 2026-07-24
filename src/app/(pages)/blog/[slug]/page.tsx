import { getServerTranslations } from "@/lib/i18n/translation/server";
import { notFound } from "next/navigation";
import Script from "next/script";
import env from "@/env";
import { createMetadataDefaults } from "@/lib/metadata";
import { BlogPostHeader } from "@/components/blog/blog-post-header";
import { ReadingContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
import { COMPANY_NAME } from "@/lib/config/constants";
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
export const dynamicParams = false;
export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({
    slug,
  }));
}
export function generateBlogPostMetadata({
  slug,
  locale,
}: {
  slug: string;
  locale: SupportedLocale;
}): Metadata {
  const post = getPostBySlug(slug, locale);
  if (!post) {
    const metadata = createMetadataDefaults();
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
  const defaultLocalizedPost = localizations.find(
    (localizedPost) => localizedPost.locale === SOURCE_LOCALE,
  );
  const description =
    post.excerpt ||
    `Read our comprehensive blog post about ${post.title}. Discover insights, tips, and best practices in this detailed article.`;
  const publishedTime = post.publishedDate
    ? new Date(post.publishedDate).toISOString()
    : undefined;
  const modifiedTime = publishedTime;
  const metadata = createMetadataDefaults({
    openGraph: {
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
      images: post.heroImage ? [post.heroImage] : undefined,
    },
    alternates: {
      canonical: getLocalizedBlogPostPath(slug, post.locale),
      languages: {
        ...languageAlternates,
        "x-default": getLocalizedBlogPostPath(
          slug,
          defaultLocalizedPost?.locale ?? post.locale,
        ),
      },
    },
  });
  return {
    ...metadata,
    title: post.title,
    description,
    openGraph: {
      ...metadata.openGraph,
      title: post.title,
      description,
    },
    twitter: {
      ...metadata.twitter,
      title: post.title,
      description,
    },
  };
}
export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateBlogPostMetadata({
    slug,
    locale: SOURCE_LOCALE,
  });
}
export async function BlogPostPageContent({
  locale,
  params,
}: BlogPostPageProps & {
  locale: SupportedLocale;
}) {
  const { t } = await getServerTranslations();
  const { slug } = await params;
  const post = getPostBySlug(slug, locale);
  if (!post) {
    notFound();
  }
  const author = getAuthorBySlug(post.author);
  const canonicalUrl = new URL(
    getLocalizedBlogPostPath(slug, post.locale),
    env.NEXT_PUBLIC_APP_URL,
  ).toString();
  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.heroImage ? [post.heroImage] : undefined,
    datePublished: post.publishedDate
      ? new Date(post.publishedDate).toISOString()
      : undefined,
    dateModified: post.publishedDate
      ? new Date(post.publishedDate).toISOString()
      : undefined,
    author: author?.name
      ? {
          "@type": "Person",
          name: author.name,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: COMPANY_NAME,
    },
    mainEntityOfPage: canonicalUrl,
    inLanguage: post.locale,
  };
  return (
    <>
      <Script
        id={`article-structured-data-${slug}`}
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleStructuredData),
        }}
      />

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

      {/* Article Content */}
      <section className="bg-background py-12 sm:py-16">
        <ReadingContainer>
          <article className="prose prose-base prose-slate dark:prose-invert markdown-content sm:prose-lg mx-auto max-w-none [&_pre]:max-w-full [&_pre]:overflow-x-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </article>
        </ReadingContainer>
      </section>

      {/* Footer */}
      <section className="bg-muted/40 py-12 sm:py-16">
        <ReadingContainer>
          <div className="text-center">
            <h2 className="text-foreground mb-4 text-xl font-bold sm:text-2xl">
              {t("77a15560ce8c", "Thanks for reading!")}
            </h2>
            <p className="text-muted-foreground mb-6 text-sm sm:mb-8 sm:text-base">
              {t(
                "b3d935a413da",
                "Want to read more articles? Check out our blog for the latest insights and updates.",
              )}
            </p>
            <Link href={getLocalizedBlogPath(locale)}>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
              >
                {t("251fa22c9d79", "Explore More Articles")}
              </Button>
            </Link>
          </div>
        </ReadingContainer>
      </section>
    </>
  );
}
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  return <BlogPostPageContent locale={SOURCE_LOCALE} params={params} />;
}
