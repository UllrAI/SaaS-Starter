import { describe, it, expect, jest } from "@jest/globals";

const mockMetadata = {
  title: "Dashboard",
  description: "Account overview, billing status, and starter setup progress.",
};
const mockCreatePageMetadata = jest.fn(async () => mockMetadata);
jest.mock("@/lib/i18n/page-metadata", () => ({
  createPageMetadata: (config: unknown) => mockCreatePageMetadata(config),
}));

// Mock all complex UI dependencies to avoid context issues
jest.mock("./_components/dashboard-page-wrapper", () => ({
  DashboardPageWrapper: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => {
    // Use parameters to avoid unused variable warnings
    return title && children ? null : null;
  },
}));

jest.mock("@/components/ui/card", () => ({
  Card: () => null,
  CardContent: () => null,
  CardDescription: () => null,
  CardHeader: () => null,
  CardTitle: () => null,
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: () => null,
}));

jest.mock("@/components/ui/button", () => ({
  Button: () => null,
}));

jest.mock("lucide-react", () => ({
  BarChart3: () => null,
  Users: () => null,
  TrendingUp: () => null,
  DollarSign: () => null,
  Activity: () => null,
  Sparkles: () => null,
  Rocket: () => null,
  Zap: () => null,
}));

import { generateMetadata } from "./page";

describe("Dashboard Home Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should export correct metadata", async () => {
    await expect(generateMetadata()).resolves.toMatchObject({
      title: "Dashboard",
      description:
        "Account overview, billing status, and starter setup progress.",
    });
  });

  it("should generate metadata from the current dashboard copy", async () => {
    const metadata = await generateMetadata();

    expect(metadata).toMatchObject({
      title: "Dashboard",
      description:
        "Account overview, billing status, and starter setup progress.",
    });
  });

  it("should export a React component as default", async () => {
    const { default: HomeRoute } = await import("./page");
    expect(typeof HomeRoute).toBe("function");
    expect(HomeRoute.name).toBe("HomeRoute");
  });

  it("should have valid component exports", async () => {
    const moduleExports = await import("./page");
    expect(moduleExports).toHaveProperty("default");
    expect(moduleExports).toHaveProperty("generateMetadata");
    expect(typeof moduleExports.default).toBe("function");
    expect(typeof moduleExports.generateMetadata).toBe("function");
  });

  it("should create metadata for SEO optimization", async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBeTruthy();
    expect(metadata.description).toBeTruthy();
    expect(String(metadata.title).length).toBeGreaterThan(0);
    expect(metadata.description?.length).toBeGreaterThan(10);
  });
});
