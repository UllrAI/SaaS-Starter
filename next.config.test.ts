import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

const mockWithNextIntl = jest.fn(
  (nextConfig: Record<string, unknown>) => nextConfig,
);

jest.mock("next-intl/plugin", () => ({
  __esModule: true,
  default: () => mockWithNextIntl,
}));

jest.mock("@content-collections/next", () => ({
  __esModule: true,
  withContentCollections: async (nextConfig: Record<string, unknown>) =>
    nextConfig,
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
    mockWithNextIntl.mockClear();
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

  it("applies the next-intl plugin", async () => {
    const getConfig = await importConfig();
    await getConfig();

    expect(mockWithNextIntl).toHaveBeenCalledTimes(1);
  });

  it("does not route private storage through the public image optimizer", async () => {
    const getConfig = await importConfig();
    const config = await getConfig();
    expect(config.images?.remotePatterns).toEqual([
      { protocol: "https", hostname: "images.unsplash.com" },
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
    ]);
  });
});
