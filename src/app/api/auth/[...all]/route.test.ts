const mockAuthHandler = jest.fn();
const mockGetHandler = jest.fn();
const mockPostHandler = jest.fn();
const mockToNextJsHandler = jest.fn(() => ({
  GET: mockGetHandler,
  POST: mockPostHandler,
}));

jest.mock("@/lib/auth/server", () => ({
  auth: {
    handler: (...args: unknown[]) => mockAuthHandler(...args),
  },
}));

jest.mock("better-auth/next-js", () => ({
  toNextJsHandler: (...args: unknown[]) => mockToNextJsHandler(...args),
}));

let GET: typeof import("./route").GET;
let POST: typeof import("./route").POST;

describe("Auth API route", () => {
  beforeAll(async () => {
    ({ GET, POST } = await import("./route"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates supported auth requests to Better Auth", async () => {
    const request = {
      url: "http://localhost/api/auth/sign-in/magic-link",
      method: "POST",
    } as Request;

    await POST(request);

    expect(GET).toBe(mockGetHandler);
    expect(mockPostHandler).toHaveBeenCalledWith(request);
  });

  it("does not expose Better Auth admin mutation endpoints", async () => {
    const request = {
      url: "http://localhost/api/auth/admin/remove-user",
      method: "POST",
    } as Request;

    const response = await POST(request);

    expect(response.status).toBe(404);
    expect(mockPostHandler).not.toHaveBeenCalled();
  });
});
