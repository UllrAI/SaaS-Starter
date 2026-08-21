import { tool } from "ai";
import { z } from "zod";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
import {
  getAllPosts,
  getLocalizedBlogPostPath,
  getPostBySlug,
  type LocalizedBlogPost,
} from "@/lib/content/blog";
import type { AgentContext } from "../context";

const MAX_SEARCH_RESULTS = 5;
const ARTICLE_PAGE_CHARS = 8000;
// Drops near-noise hits: a match on common words alone scores far below a
// title or tag match, so results below half the top score are not relevant.
const RELEVANCE_RATIO = 0.5;

export interface KnowledgeSearchResult {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  path: string;
  score: number;
}

/**
 * Every article, preferring the reader's locale and falling back to the source
 * locale. Without the fallback a partially translated site would hide most of
 * its own knowledge base from non-English readers.
 */
function getSearchablePosts(locale: SupportedLocale): LocalizedBlogPost[] {
  const sourcePosts = getAllPosts(SOURCE_LOCALE);
  if (locale === SOURCE_LOCALE) {
    return sourcePosts;
  }

  const localizedBySlug = new Map(
    getAllPosts(locale).map((post) => [post.slug, post]),
  );
  return sourcePosts.map((post) => localizedBySlug.get(post.slug) ?? post);
}

/**
 * Splits a query into searchable terms. Languages without word spacing are
 * additionally expanded into character bigrams so "密钥吗" still matches "密钥".
 */
export function tokenizeQuery(query: string): string[] {
  const terms = new Set<string>();

  for (const segment of query.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (segment.length < 2) {
      continue;
    }

    if (
      /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(segment)
    ) {
      for (let index = 0; index < segment.length - 1; index += 1) {
        terms.add(segment.slice(index, index + 2));
      }
    } else {
      terms.add(segment);
    }
  }

  return [...terms];
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

// Exported so the ranking stays unit-testable on its own.
export function searchPosts(
  query: string,
  locale: SupportedLocale,
): KnowledgeSearchResult[] {
  const terms = tokenizeQuery(query);
  if (terms.length === 0) {
    return [];
  }

  const ranked = getSearchablePosts(locale)
    .map((post) => ({ post, score: scorePost(terms, post) }))
    .filter((entry) => entry.score > 0)
    .toSorted((a, b) => b.score - a.score);

  const relevanceFloor = (ranked[0]?.score ?? 0) * RELEVANCE_RATIO;

  return ranked
    .filter((entry) => entry.score >= relevanceFloor)
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
      "Read a knowledge-base article by its slug (from search results). Long articles are paginated: pass the returned nextOffset to continue reading.",
    inputSchema: z.object({
      slug: z.string().min(1).describe("The article slug to read."),
      offset: z
        .number()
        .int()
        .nonnegative()
        .default(0)
        .describe("Character offset to read from. Use nextOffset to continue."),
    }),
    execute: ({ slug, offset }) => {
      const post =
        getPostBySlug(slug, locale) ?? getPostBySlug(slug, SOURCE_LOCALE);
      if (!post) {
        return { error: `No article found for slug "${slug}".` };
      }

      const start = Math.min(offset, post.content.length);
      const end = start + ARTICLE_PAGE_CHARS;
      const hasMore = end < post.content.length;

      return {
        title: post.title,
        path: getLocalizedBlogPostPath(post.slug, locale),
        content: post.content.slice(start, end),
        hasMore,
        nextOffset: hasMore ? end : null,
      };
    },
  });
}
