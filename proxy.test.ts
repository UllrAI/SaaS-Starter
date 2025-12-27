import { NextRequest, NextResponse } from "next/server";
import authMiddleware from "./src/proxy";
import { getSessionCookie } from "better-auth/cookies";

// Mock better-auth/cookies
jest.mock("better-auth/cookies", () => ({
  getSessionCookie: jest.fn() as jest.MockedFunction<
    (cookies: {
      get: (name: string) => { value: string } | undefined;
    }) => string | null
  >,
}));

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextResponse: {
    redirect: jest.fn((url) => ({ headers: new Headers({ location: url }) })),
    next: jest.fn(() => ({})), // Mock next() to return a simple object
  },
  NextRequest: jest.fn((url) => ({
    url: url, // Ensure url is a full string
    nextUrl: new URL(url),
    cookies: {
      get: jest.fn() as jest.MockedFunction<
        (name: string) => { value: string } | undefined
      >,
    },
  })),
}));

describe("authMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should redirect logged-in users from auth pages to /dashboard", async () => {
    (getSessionCookie as jest.Mock).mockReturnValue("some-session-cookie");

    const request = new NextRequest("http://localhost/login");
    const response = await authMiddleware(request);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL("/dashboard", request.url),
    );
    expect(response?.headers.get("location")).toBe(
      "http://localhost/dashboard",
    );
  });

  it("should redirect unauthenticated users from dashboard pages to /login with callbackUrl", async () => {
    (getSessionCookie as jest.Mock).mockReturnValue(undefined);

    const request = new NextRequest("http://localhost/dashboard/settings");
    const response = await authMiddleware(request);

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", "/dashboard/settings");

    expect(NextResponse.redirect).toHaveBeenCalledWith(loginUrl);
    expect(response?.headers.get("location")).toBe(
      "http://localhost/login?callbackUrl=%2Fdashboard%2Fsettings",
    );
  });

  it("should allow logged-in users to access non-auth, non-dashboard pages", async () => {
    (getSessionCookie as jest.Mock).mockReturnValue("some-session-cookie");

    const request = new NextRequest("http://localhost/some-other-page");
    const response = await authMiddleware(request);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(response).toEqual({});
  });

  it("should allow unauthenticated users to access non-auth, non-dashboard pages", async () => {
    (getSessionCookie as jest.Mock).mockReturnValue(undefined);

    const request = new NextRequest("http://localhost/some-other-page");
    const response = await authMiddleware(request);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(response).toEqual({});
  });

  it("should redirect logged-in users from /signup to /dashboard", async () => {
    (getSessionCookie as jest.Mock).mockReturnValue("some-session-cookie");

    const request = new NextRequest("http://localhost/signup");
    const response = await authMiddleware(request);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL("/dashboard", request.url),
    );
    expect(response?.headers.get("location")).toBe(
      "http://localhost/dashboard",
    );
  });

  it("should redirect logged-in users from /auth/sent to /dashboard", async () => {
    (getSessionCookie as jest.Mock).mockReturnValue("some-session-cookie");

    const request = new NextRequest("http://localhost/auth/sent");
    const response = await authMiddleware(request);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL("/dashboard", request.url),
    );
    expect(response?.headers.get("location")).toBe(
      "http://localhost/dashboard",
    );
  });

  it("should allow unauthenticated users to access /login", async () => {
    (getSessionCookie as jest.Mock).mockReturnValue(undefined);

    const request = new NextRequest("http://localhost/login");
    const response = await authMiddleware(request);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(response).toEqual({});
  });

  it("should allow unauthenticated users to access /signup", async () => {
    (getSessionCookie as jest.Mock).mockReturnValue(undefined);

    const request = new NextRequest("http://localhost/signup");
    const response = await authMiddleware(request);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(response).toEqual({});
  });

  it("should allow unauthenticated users to access /auth/sent", async () => {
    (getSessionCookie as jest.Mock).mockReturnValue(undefined);

    const request = new NextRequest("http://localhost/auth/sent");
    const response = await authMiddleware(request);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(response).toEqual({});
  });
});
