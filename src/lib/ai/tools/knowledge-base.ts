import { tool } from "ai";
import { z } from "zod";
import type { SupportedLocale } from "@/lib/config/i18n";
import {
  getAllPosts,
  getLocalizedBlogPostPath,
  getPostBySlug,
  type LocalizedBlogPost,
} from "@/lib/content/blog";
import type { AgentContext } from "../context";

const MAX_SEARCH_RESULTS = 5;
const MAX_ARTICLE_CHARS = 8000;

export interface KnowledgeSearchResult {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  path: string;
  score: number;
}

function scorePost(terms: string[], post: LocalizedBlogPost): number {
  const title = post.title.toLowerCase();
  const excerpt = (post.excerpt ?? "").toLowerCase();
  const tags = post.tags.map((tag) => tag.toLowerCase());
  const content = post.content.toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (title.includes(term)) score += 5;
    if (tags.some((tag) => tag.includes(term))) score += 3;
    if (excerpt.includes(term)) score += 2;
    if (content.includes(term)) score += 1;
  }
  return score;
}

// Exported for tests and for reuse outside the agent (e.g. a search page).
export function searchPosts(
  query: string,
  locale: SupportedLocale,
): KnowledgeSearchResult[] {
  const terms = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length > 1);

  if (terms.length === 0) {
    return [];
  }

  return getAllPosts(locale)
    .map((post) => ({ post, score: scorePost(terms, post) }))
    .filter((entry) => entry.score > 0)
    .toSorted((a, b) => b.score - a.score)
    .slice(0, MAX_SEARCH_RESULTS)
    .map(({ post, score }) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt ?? "",
      tags: post.tags,
      path: getLocalizedBlogPostPath(post.slug, locale),
      score,
    }));
}

export function createSearchKnowledgeBase(context: AgentContext) {
  const { locale } = context;
  return tool({
    description:
      "Search the product knowledge base (blog articles and guides) by keywords. Returns matching articles with slugs to read.",
    inputSchema: z.object({
      query: z
        .string()
        .min(2)
        .describe("Keywords to search for, e.g. 'api keys cli auth'."),
    }),
    execute: ({ query }) => {
      const results = searchPosts(query, locale);
      return results.length > 0
        ? { results }
        : { results: [], note: "No articles matched the query." };
    },
  });
}

export function createReadArticle(context: AgentContext) {
  const { locale } = context;
  return tool({
    description:
      "Read the full content of a knowledge-base article by its slug (from search results).",
    inputSchema: z.object({
      slug: z.string().min(1).describe("The article slug to read."),
    }),
    execute: ({ slug }) => {
      const post = getPostBySlug(slug, locale);
      if (!post) {
        return { error: `No article found for slug "${slug}".` };
      }
      return {
        title: post.title,
        path: getLocalizedBlogPostPath(post.slug, locale),
        content:
          post.content.length > MAX_ARTICLE_CHARS
            ? `${post.content.slice(0, MAX_ARTICLE_CHARS)}\n\n[Truncated.]`
            : post.content,
      };
    },
  });
}
