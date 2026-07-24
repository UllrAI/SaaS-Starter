import { GET, HEAD, OPTIONS, POST } from "./route";

describe("not-found response route", () => {
  it("returns a crawl-safe, no-JavaScript 404 document", async () => {
    const response = GET();
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toBe(
      "text/html; charset=utf-8",
    );
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("<h1>Page Not Found</h1>");
    expect(html).toContain('href="/"');
    expect(html).not.toContain("<script");
  });

  it.each([
    ["HEAD", HEAD],
    ["OPTIONS", OPTIONS],
    ["POST", POST],
  ])(
    "keeps rewritten %s requests on a deterministic 404",
    (_method, handler) => {
      expect(handler().status).toBe(404);
    },
  );
});
