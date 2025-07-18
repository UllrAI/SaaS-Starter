import { MetadataRoute } from "next";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "@/keystatic.config";
import env from "@/env";

const reader = createReader(process.cwd(), keystaticConfig);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  // Base URL for the site
  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  // Define static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "daily", // Or 'weekly', 'monthly' depending on how often the homepage content changes
      priority: 1.0, // Homepage usually has the highest priority
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified,
      changeFrequency: "yearly", // Contact page might not change often
      priority: 0.5,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  // Fetch dynamic blog posts from Keystatic
  const blogPosts = await reader.collections.posts.all();
  const blogPostEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.entry.publishedDate
      ? new Date(post.entry.publishedDate)
      : lastModified,
    changeFrequency: "monthly" as const,
    priority: post.entry.featured ? 0.8 : 0.7,
  }));

  return [...staticPages, ...blogPostEntries];
}
