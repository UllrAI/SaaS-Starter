import {
  BlogPostPageContent,
  generateBlogPostMetadata,
} from "@/app/(pages)/blog/[slug]/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TARGET_LOCALES } from "@/lib/config/i18n";
import { resolveStaticMarketingParams } from "@/lib/i18n/static-marketing-locale";
import { getAllPostSlugs, getPostBySlug } from "@/lib/content/blog";

type LocalizedBlogPostPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return TARGET_LOCALES.flatMap((locale) =>
    getAllPostSlugs(locale).map((slug) => ({
      locale,
      slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: LocalizedBlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await resolveStaticMarketingParams(params);

  return generateBlogPostMetadata({ slug, locale });
}

export default async function LocalizedBlogPostPage({
  params,
}: LocalizedBlogPostPageProps) {
  const { slug } = await params;
  const locale = await resolveStaticMarketingParams(params);
  if (!getPostBySlug(slug, locale)) {
    notFound();
  }

  return <BlogPostPageContent locale={locale} params={params} />;
}
