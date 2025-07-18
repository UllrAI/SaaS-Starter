import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "@/keystatic.config";
import { notFound } from "next/navigation";
import Markdoc from "@markdoc/markdoc";
import React from "react";
import { createMetadata } from "@/lib/metadata";
import { BlogPostHeader } from "@/components/blog/blog-post-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";
import { renderMarkdoc } from "@/lib/utils";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const reader = createReader(process.cwd(), keystaticConfig);

export async function generateStaticParams() {
  const posts = await reader.collections.posts.all();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await reader.collections.posts.read(slug);

  if (!post) {
    return createMetadata({
      title: "Post Not Found",
      description: "The requested blog post could not be found.",
    });
  }

  const description =
    post.excerpt ||
    `Read our comprehensive blog post about ${post.title}. Discover insights, tips, and best practices in this detailed article.`;
  const publishedTime = post.publishedDate
    ? new Date(post.publishedDate).toISOString()
    : undefined;
  const modifiedTime = publishedTime; // Use published date as modified time for now

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
      canonical: `/blog/${slug}`,
    },
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await reader.collections.posts.read(slug);

  if (!post) {
    notFound();
  }

  const content = await post.content();
  const author = post.author
    ? await reader.collections.authors.read(post.author)
    : null;

  return (
    <>
      <BlogPostHeader
        title={post.title}
        excerpt={post.excerpt || undefined}
        heroImage={post.heroImage || undefined}
        publishedDate={post.publishedDate || undefined}
        featured={post.featured}
        tags={post.tags ? [...post.tags] : undefined}
        content={renderMarkdoc(content.node)}
        author={author?.name || "Anonymous"}
      />

      {/* Article Content */}
      <section className="bg-background py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <article className="prose prose-base prose-slate dark:prose-invert sm:prose-lg markdoc-content mx-auto max-w-none">
              {Markdoc.renderers.react(Markdoc.transform(content.node), React)}
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
            <Link href="/blog">
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
