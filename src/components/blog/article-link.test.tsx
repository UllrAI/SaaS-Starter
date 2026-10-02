import { render, screen } from "@testing-library/react";
import { ArticleLink } from "./article-link";

jest.mock("next-intl", () => ({ useLocale: () => "en" }));

describe("article links", () => {
  it("tracks source CTAs with the article and locale without changing their URL", () => {
    render(
      <ArticleLink
        href="https://github.com/UllrAI/SaaS-Starter/?utm_source=article"
        slug="saas-starter-kit-developer-guide"
        locale="zh-Hans"
      >
        Source
      </ArticleLink>,
    );
    const link = screen.getByRole("link", { name: "Source" });
    expect(link).toHaveAttribute("data-umami-event", "github_source_click");
    expect(link).toHaveAttribute("data-umami-event-source", "blog_article");
    expect(link).toHaveAttribute(
      "data-umami-event-article",
      "saas-starter-kit-developer-guide",
    );
    expect(link).toHaveAttribute("data-umami-event-locale", "zh-Hans");
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/UllrAI/SaaS-Starter/?utm_source=article",
    );
  });

  it.each([
    "https://github.com/UllrAI/SaaS-Starter/blob/main/docs/webhooks.md",
    "https://github.com/another/project",
    "#setup",
    "mailto:support@example.com",
  ])("does not label a non-CTA link as a source conversion: %s", (href) => {
    render(
      <ArticleLink href={href} slug="guide" locale="en">
        Reference
      </ArticleLink>,
    );
    const link = screen.getByRole("link", { name: "Reference" });
    expect(link).not.toHaveAttribute("data-umami-event");
    expect(link).toHaveAttribute("href", href);
  });

  it("preserves locale, query and fragment on public marketing links", () => {
    render(
      <ArticleLink
        href="/features?from=guide#uploads"
        slug="guide"
        locale="zh-Hans"
      >
        Features
      </ArticleLink>,
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/zh-Hans/features?from=guide#uploads",
    );
  });

  it.each([
    [
      "/blog/saas-starter-kit-developer-guide",
      "/zh-Hans/blog/saas-starter-kit-developer-guide",
    ],
    [
      "/blog/nextjs-16-saas-starter-architecture",
      "/blog/nextjs-16-saas-starter-architecture",
    ],
  ])("links to an existing article locale for %s", (href, expectedHref) => {
    render(
      <ArticleLink href={href} slug="guide" locale="zh-Hans">
        Read
      </ArticleLink>,
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", expectedHref);
  });
});
