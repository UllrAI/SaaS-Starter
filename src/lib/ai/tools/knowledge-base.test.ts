import type { ToolExecutionOptions } from "ai";
import type { AgentContext } from "../context";
import {
  createReadArticle,
  createSearchKnowledgeBase,
  searchPosts,
  tokenizeQuery,
} from "./knowledge-base";

const context: AgentContext = {
  userId: "user-1",
  userName: "Ada",
  userEmail: "ada@example.com",
  userRole: "user",
  locale: "en",
};

const zhContext: AgentContext = { ...context, locale: "zh-Hans" };
const executionOptions = {} as ToolExecutionOptions;

describe("tokenizeQuery", () => {
  it("keeps latin words and drops single characters", () => {
    expect(tokenizeQuery("API keys, a CLI!")).toEqual(["api", "keys", "cli"]);
  });

  it("expands CJK segments into bigrams so substrings still match", () => {
    expect(tokenizeQuery("密钥吗")).toEqual(["密钥", "钥吗"]);
  });
});

describe("searchPosts", () => {
  it("ranks matches by relevance and links each result", () => {
    const results = searchPosts("agent", "en");
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result.path).toContain(`/blog/${result.slug}`);
      expect(result.score).toBeGreaterThan(0);
    }
    const scores = results.map((result) => result.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("returns nothing for queries with no usable terms", () => {
    expect(searchPosts("!", "en")).toEqual([]);
    expect(searchPosts("zzzznonexistentterm", "en")).toEqual([]);
  });

  it("finds untranslated articles for a partially translated locale", () => {
    // Only two articles have a zh-Hans translation; without a source-locale
    // fallback the rest would be invisible to a Chinese reader.
    const results = searchPosts("stripe billing webhooks", "zh-Hans");
    expect(results.map((result) => result.slug)).toContain(
      "stripe-nextjs-billing-production-guide",
    );
  });

  it("drops low-relevance noise below the relevance floor", () => {
    const results = searchPosts("how do we set up billing", "en");
    expect(results.length).toBeGreaterThan(0);
    const topScore = results[0].score;
    for (const result of results) {
      expect(result.score).toBeGreaterThanOrEqual(topScore * 0.5);
    }
  });
});

describe("knowledge base tools", () => {
  it("search tool reports when nothing matches", async () => {
    const search = createSearchKnowledgeBase(context);
    const result = (await search.execute!(
      { query: "zzzznonexistentterm" },
      executionOptions,
    )) as { results: unknown[]; note?: string };
    expect(result.results).toEqual([]);
    expect(result.note).toBeTruthy();
  });

  it("read tool returns article content for a slug found via search", async () => {
    const [top] = searchPosts("agent", "en");
    const read = createReadArticle(context);
    const result = (await read.execute!(
      { slug: top.slug, offset: 0 },
      executionOptions,
    )) as { title?: string; content?: string; error?: string };
    expect(result.error).toBeUndefined();
    expect(result.title).toBeTruthy();
    expect(result.content).toBeTruthy();
  });

  it("paginates long articles so the whole text stays reachable", async () => {
    const read = createReadArticle(context);
    const first = (await read.execute!(
      { slug: "saas-starter-kit-developer-guide", offset: 0 },
      executionOptions,
    )) as { content: string; hasMore: boolean; nextOffset: number | null };
    expect(first.hasMore).toBe(true);
    expect(first.nextOffset).toBe(first.content.length);

    const second = (await read.execute!(
      { slug: "saas-starter-kit-developer-guide", offset: first.nextOffset! },
      executionOptions,
    )) as { content: string };
    expect(second.content).toBeTruthy();
    expect(second.content).not.toBe(first.content);
  });

  it("reads source-locale content when the article is untranslated", async () => {
    const read = createReadArticle(zhContext);
    const result = (await read.execute!(
      { slug: "saas-starter-kit-developer-guide", offset: 0 },
      executionOptions,
    )) as { content?: string; error?: string };
    expect(result.error).toBeUndefined();
    expect(result.content).toBeTruthy();
  });

  it("read tool reports unknown slugs instead of throwing", async () => {
    const read = createReadArticle(context);
    const result = (await read.execute!(
      { slug: "does-not-exist", offset: 0 },
      executionOptions,
    )) as { error?: string };
    expect(result.error).toContain("does-not-exist");
  });
});
