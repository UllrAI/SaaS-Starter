import type { ToolExecutionOptions } from "ai";
import type { AgentContext } from "../context";
import {
  createReadArticle,
  createSearchKnowledgeBase,
  searchPosts,
} from "./knowledge-base";

const context: AgentContext = {
  userId: "user-1",
  userName: "Ada",
  userEmail: "ada@example.com",
  userRole: "user",
  locale: "en",
};

const executionOptions = {} as ToolExecutionOptions;

describe("searchPosts", () => {
  it("ranks title matches above content-only matches", () => {
    const results = searchPosts("agent", "en");
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result.slug).toBeTruthy();
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
      { slug: top.slug },
      executionOptions,
    )) as { title?: string; content?: string; error?: string };
    expect(result.error).toBeUndefined();
    expect(result.title).toBeTruthy();
    expect(result.content).toBeTruthy();
  });

  it("read tool reports unknown slugs instead of throwing", async () => {
    const read = createReadArticle(context);
    const result = (await read.execute!(
      { slug: "does-not-exist" },
      executionOptions,
    )) as { error?: string };
    expect(result.error).toContain("does-not-exist");
  });
});
