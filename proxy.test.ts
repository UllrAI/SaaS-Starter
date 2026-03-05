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

  it("redirects bare marketing path to localized path when preferred locale is non-English", async () => {
    const request = new NextRequest("http://localhost/about", {
      headers: {
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
    });

    const response = await proxy(request);

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get("location")).toBe(
      "http://localhost/zh-Hans/about",
    );
  });

  it("rewrites localized marketing path to existing route and keeps locale context", async () => {
    const request = new NextRequest("http://localhost/zh-Hans/pricing");

    const response = await proxy(request);

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost/pricing",
    );
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
});
