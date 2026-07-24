import { NextRequest } from "next/server";
import proxy from "./src/proxy";
import { getSessionCookie } from "better-auth/cookies";

jest.mock("better-auth/cookies", () => ({
  getSessionCookie: jest.fn(),
}));

const mockGetSessionCookie = getSessionCookie as jest.MockedFunction<
  typeof getSessionCookie
>;

describe("proxy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSessionCookie.mockReturnValue(undefined);
  });

  it("redirects unauthenticated dashboard requests to /login with callbackUrl", async () => {
    const request = new NextRequest("http://localhost/dashboard/settings");

    const response = await proxy(request);

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get("location")).toBe(
      "http://localhost/login?callbackUrl=%2Fdashboard%2Fsettings",
    );
  });

  it("keeps dashboard access for authenticated users", async () => {
    mockGetSessionCookie.mockReturnValue("session-token");
    const request = new NextRequest("http://localhost/dashboard");

    const response = await proxy(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not treat dashboard-like paths as protected dashboard routes", async () => {
    const request = new NextRequest("http://localhost/dashboard-like");

    const response = await proxy(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost/not-found-response",
    );
  });

  it("redirects bare marketing paths to the preferred supported locale", async () => {
    const request = new NextRequest("http://localhost/about", {
      headers: {
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
    });

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/zh-Hans/about",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toBe("Accept-Language, Cookie");
    expect(response.cookies.get("locale")?.value).toBe("zh-Hans");
  });

  it("prefers a saved locale over the browser language", async () => {
    const request = new NextRequest("http://localhost/pricing", {
      headers: {
        "accept-language": "en-US,en;q=0.9",
        cookie: "locale=zh-Hans",
      },
    });

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/zh-Hans/pricing",
    );
  });

  it("keeps the canonical English URL after an explicit English selection", async () => {
    const request = new NextRequest("http://localhost/about", {
      headers: {
        "accept-language": "zh-CN,zh;q=0.9",
        cookie: "locale=en",
      },
    });

    const response = await proxy(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("vary")).toBe("Accept-Language, Cookie");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("keeps localized marketing path on its static route", async () => {
    const request = new NextRequest("http://localhost/zh-Hans/pricing");

    const response = await proxy(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("does not rewrite an unchanged locale cookie", async () => {
    const request = new NextRequest("http://localhost/zh-Hans/pricing", {
      headers: { cookie: "locale=zh-Hans" },
    });

    const response = await proxy(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("canonicalizes aliased locale segment to configured locale segment", async () => {
    const request = new NextRequest("http://localhost/zh/contact");

    const response = await proxy(request);

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get("location")).toBe(
      "http://localhost/zh-Hans/contact",
    );
  });

  it("does not let external locale headers bypass marketing canonicalization", async () => {
    const request = new NextRequest("http://localhost/zh/contact", {
      headers: {
        "x-user-locale": "en",
      },
    });

    const response = await proxy(request);

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get("location")).toBe(
      "http://localhost/zh-Hans/contact",
    );
  });

  it("redirects /en-prefixed marketing paths to English canonical bare paths", async () => {
    const request = new NextRequest("http://localhost/en/blog");

    const response = await proxy(request);

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get("location")).toBe("http://localhost/blog");
  });

  it("keeps bare marketing path when preferred locale is unsupported", async () => {
    const request = new NextRequest("http://localhost/terms", {
      headers: {
        "accept-language": "fr-FR,fr;q=0.9",
      },
    });

    const response = await proxy(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("vary")).toBe("Accept-Language, Cookie");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("redirects unsupported locale-prefixed marketing paths to English", async () => {
    const request = new NextRequest("http://localhost/zh-TW/about");

    const response = await proxy(request);

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("http://localhost/about");
    expect(response.cookies.get("locale")).toBeUndefined();
  });

  it("does not select a locale explicitly excluded by q=0", async () => {
    const request = new NextRequest("http://localhost/about", {
      headers: {
        "accept-language": "fr,zh;q=0",
      },
    });

    const response = await proxy(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not expose a locale cookie update to shared caches", async () => {
    const request = new NextRequest("http://localhost/about", {
      headers: {
        "accept-language": "en-US",
        cookie: "locale=fr",
      },
    });

    const response = await proxy(request);

    expect(response.cookies.get("locale")?.value).toBe("en");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toBe("Accept-Language, Cookie");
  });

  it("does not apply marketing locale redirects to non-marketing routes", async () => {
    const request = new NextRequest("http://localhost/login", {
      headers: {
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
    });

    const response = await proxy(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("rewrites unknown unlocalized paths to the global 404 boundary", async () => {
    const request = new NextRequest("http://localhost/not-a-route");

    const response = await proxy(request);

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost/not-found-response",
    );
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets the internal not-found response route execute without a rewrite loop", async () => {
    const request = new NextRequest("http://localhost/not-found-response");

    const response = await proxy(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
