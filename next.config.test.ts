import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Mock @lingo.dev/compiler/next to avoid loading modules that rely on experimental VM flags
const mockWithLingo = jest.fn(
  async (nextConfig: Record<string, unknown>) => nextConfig,
);

jest.mock("@lingo.dev/compiler/next", () => ({
  __esModule: true,
  withLingo: mockWithLingo,
}));

// Mock next/bundle-analyzer
jest.mock("@next/bundle-analyzer", () => {
  const mockWithBundleAnalyzer = jest.fn(
    () => (nextConfig: Record<string, unknown>) => ({
      ...nextConfig,
      analyzed: true,
    }),
  );
  return mockWithBundleAnalyzer;
});

describe("next.config.ts", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleErrorSpy: any;
  const importConfig = async () => {
    const mod = await import("./next.config");
    return (mod as any).default;
  };

  beforeEach(() => {
    jest.resetModules(); // Clear module cache before each test
    originalEnv = process.env; // Store original process.env
    process.env = { ...originalEnv }; // Create a writable copy
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockWithLingo.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv; // Restore original process.env
    consoleErrorSpy.mockRestore();
  });

  it("should enable bundle analyzer when ANALYZE is 'true'", async () => {
    process.env.ANALYZE = "true";
    // Mock @/env locally for this test
    jest.doMock("@/env", () => ({
      __esModule: true,
      default: {
        R2_PUBLIC_URL: "https://test-r2.example.com",
      },
    }));
    const getConfig = await importConfig();
    const nextConfig = await getConfig();
    expect(nextConfig).toHaveProperty("analyzed", true);
  });

  it("should not enable bundle analyzer when ANALYZE is not 'true'", async () => {
    process.env.ANALYZE = "false"; // Or any other value
    // Mock @/env locally for this test
    jest.doMock("@/env", () => ({
      __esModule: true,
      default: {
        R2_PUBLIC_URL: "https://test-r2.example.com",
      },
    }));
    const getConfig = await importConfig();
    const nextConfig = await getConfig();
    expect(nextConfig).not.toHaveProperty("analyzed");
  });

  it("should handle invalid R2_PUBLIC_URL gracefully", async () => {
    jest.doMock("@/env", () => ({
      __esModule: true,
      default: {
        R2_PUBLIC_URL: "invalid-url",
      },
    }));

    const getConfig = await importConfig();
    const nextConfig = await getConfig();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "\x1b[33m%s\x1b[0m",
      "Warning: Invalid R2_PUBLIC_URL found in environment variables. Skipping R2 remote pattern.",
    );
    expect((nextConfig as any).images.remotePatterns).not.toContainEqual({
      protocol: "https",
      hostname: "invalid-url",
    });
  });

  it("should include R2 hostname in remotePatterns if R2_PUBLIC_URL is valid", async () => {
    process.env.R2_PUBLIC_URL = "https://valid-r2.example.com";
    jest.doMock("@/env", () => ({
      __esModule: true,
      default: {
        R2_PUBLIC_URL: "https://valid-r2.example.com",
      },
    }));
    const getConfig = await importConfig();
    const nextConfig = await getConfig();
    expect((nextConfig as any).images.remotePatterns).toEqual([
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
      },
      {
        protocol: "https",
        hostname: "valid-r2.example.com",
      },
    ]);
  });

  it("should not include R2 hostname in remotePatterns if R2_PUBLIC_URL is not set", async () => {
    process.env.R2_PUBLIC_URL = undefined;
    jest.doMock("@/env", () => ({
      __esModule: true,
      default: {
        R2_PUBLIC_URL: undefined,
      },
    }));
    const getConfig = await importConfig();
    const nextConfig = await getConfig();
    expect((nextConfig as any).images.remotePatterns).toEqual([
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
      },
    ]);
  });
});
