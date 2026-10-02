import { expect, test } from "@playwright/test";

test("canonicalizes zh locale aliases to zh-Hans marketing routes", async ({
  page,
}) => {
  await page.goto("/zh/about");

  await expect(page).toHaveURL(/\/zh-Hans\/about$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("redirects /en-prefixed marketing routes to canonical English paths", async ({
  page,
}) => {
  await page.goto("/en/about");

  await expect(page).toHaveURL(/\/about$/);
  await expect(
    page.getByRole("heading", { name: /Building the future of SaaS/i }),
  ).toBeVisible();
});

for (const locale of ["en", "zh-Hans"] as const) {
  test(`developer guide has accurate metadata, copy and source attribution (${locale})`, async ({
    page,
  }) => {
    const prefix = locale === "en" ? "" : "/zh-Hans";
    const path = `${prefix}/blog/saas-starter-kit-developer-guide`;
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new URL(path, page.url()).toString(),
    );
    for (const alternate of ["en", "zh-Hans", "x-default"]) {
      await expect(
        page.locator(`link[rel="alternate"][hreflang="${alternate}"]`),
      ).toHaveCount(1);
    }
    const article = page.locator("article");
    await expect(article).toContainText("Node.js ≥22.12.0");
    await expect(article).toContainText("eslint.config.mjs");
    await expect(article).not.toContainText("src/app/layout.tsx");
    await expect(article).not.toContainText("src/lib/actions/admin.ts");
    await expect(article).not.toContainText(".eslintrc.json");
    const source = article
      .locator('[data-umami-event="github_source_click"]')
      .first();
    await expect(source).toHaveAttribute(
      "data-umami-event-article",
      "saas-starter-kit-developer-guide",
    );
    await expect(source).toHaveAttribute(
      "data-umami-event-source",
      "blog_article",
    );
    await expect(source).toHaveAttribute("data-umami-event-locale", locale);
    await expect(
      article.locator('a[href="/blog/nextjs-16-saas-starter-architecture"]'),
    ).toBeVisible();
    await expect(article.locator(`a[href="${prefix}/features"]`)).toBeVisible();
    const schema = await page
      .locator(
        'script[id="article-structured-data-saas-starter-kit-developer-guide"]',
      )
      .textContent();
    const graph = JSON.parse(schema ?? "{}")["@graph"] as Array<
      Record<string, unknown>
    >;
    expect(graph.find((item) => item["@type"] === "Article")).toMatchObject({
      dateModified: "2026-10-02T00:00:00.000Z",
      inLanguage: locale,
      mainEntityOfPage: new URL(path, page.url()).toString(),
      author: { "@type": "Person", name: "UllrAI" },
    });
    expect(
      graph.find((item) => item["@type"] === "BreadcrumbList"),
    ).toBeDefined();
  });
}

for (const slug of [
  "nextjs-16-saas-starter-architecture",
  "stripe-nextjs-billing-production-guide",
  "api-keys-oauth-device-flow-saas-agents",
]) {
  test(`topic article renders an attributed source conversion: ${slug}`, async ({
    page,
  }) => {
    await page.goto(`/blog/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const source = page.locator(
      'article a[data-umami-event="github_source_click"]',
    );
    await expect(source).toHaveCount(1);
    await expect(source).toHaveAttribute("data-umami-event-article", slug);
    await expect(source).toHaveAttribute(
      "data-umami-event-source",
      "blog_article",
    );
    await expect(source).toHaveAttribute("data-umami-event-locale", "en");
  });
}

test("Chinese guide links reach English-only articles despite the saved Chinese locale", async ({
  page,
}) => {
  await page.goto("/zh-Hans/blog/saas-starter-kit-developer-guide");
  const articleLink = page.locator(
    'article a[href="/blog/nextjs-16-saas-starter-architecture"]',
  );
  await articleLink.click();
  await expect(page).toHaveURL(/\/blog\/nextjs-16-saas-starter-architecture$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Next.js 16",
  );
});
