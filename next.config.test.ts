import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import packageJson from "./package.json";

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
    ]);
  });
  it("defaults deploymentId to the package version", async () => {
    delete process.env.NEXT_DEPLOYMENT_ID;
    jest.doMock("@/env", () => ({
      __esModule: true,
      default: {
        R2_PUBLIC_URL: undefined,
      },
    }));
    const getConfig = await importConfig();
    const nextConfig = await getConfig();
    expect((nextConfig as any).deploymentId).toBe(
      packageJson.version.replace(/\./g, "-"),
    );
  });

  it("normalises characters next build would reject", async () => {
    // `next build` only accepts [A-Za-z0-9_-]; a raw semantic version or commit
    // ref would fail the build outright.
    process.env.NEXT_DEPLOYMENT_ID = "v1.2.3+build/7";
    jest.doMock("@/env", () => ({
      __esModule: true,
      default: {
        R2_PUBLIC_URL: undefined,
      },
    }));
    const getConfig = await importConfig();
    const nextConfig = await getConfig();
    expect((nextConfig as any).deploymentId).toBe("v1-2-3-build-7");
    expect((nextConfig as any).deploymentId).toMatch(/^[A-Za-z0-9_-]*$/);
  });

  it("prefers NEXT_DEPLOYMENT_ID over the package version", async () => {
    process.env.NEXT_DEPLOYMENT_ID = "release-2026-09-05";
    jest.doMock("@/env", () => ({
      __esModule: true,
      default: {
        R2_PUBLIC_URL: undefined,
      },
    }));
    const getConfig = await importConfig();
    const nextConfig = await getConfig();
    expect((nextConfig as any).deploymentId).toBe("release-2026-09-05");
  });

  it("resolves the same deploymentId on every load", async () => {
    // `next build` loads this config in several processes, and the ID compiled
    // into the client bundle must match the one frozen into the standalone
    // server. A random or time-based value would break every Server Action.
    delete process.env.NEXT_DEPLOYMENT_ID;
    const loadDeploymentId = async () => {
      jest.doMock("@/env", () => ({
        __esModule: true,
        default: {
          R2_PUBLIC_URL: undefined,
        },
      }));
      const getConfig = await importConfig();
      return (await getConfig()).deploymentId;
    };

    const first = await loadDeploymentId();
    jest.resetModules();
    const second = await loadDeploymentId();

    expect(first).toBe(second);
    expect(first).toBeTruthy();
  });
});
