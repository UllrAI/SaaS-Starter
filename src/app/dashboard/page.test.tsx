import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";

const mockCreateMetadata = jest.fn();
const mockRequireAuth = jest.fn();
const mockGetUserSubscription = jest.fn();
const mockGetUserPayments = jest.fn();
const mockGetRequestLocale = jest.fn();
const mockDbSelect = jest.fn();
const mockCount = jest.fn();
const mockEq = jest.fn();
const mockSum = jest.fn();
const mockFormatCurrency = jest.fn();
const mockFormatFileSize = jest.fn();

describe("Dashboard Home Page", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockCreateMetadata.mockReturnValue({});
    mockRequireAuth.mockResolvedValue({
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      role: "super_admin",
    });
    mockGetUserSubscription.mockResolvedValue({
      tierId: "pro",
      status: "active",
    });
    mockGetUserPayments.mockResolvedValue([
      {
        paymentId: "pay_1",
        amount: 1200,
        currency: "usd",
        status: "succeeded",
        paymentType: "one_time",
        tierName: "Pro",
        createdAt: "2026-03-06T00:00:00.000Z",
      },
    ]);
    mockGetRequestLocale.mockResolvedValue("en-US");
    mockDbSelect.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ count: 3, totalSize: "4096" }]),
      }),
    });
    mockCount.mockReturnValue("count(*)");
    mockEq.mockReturnValue("uploads.userId = user-123");
    mockSum.mockReturnValue("sum(fileSize)");
    mockFormatCurrency.mockImplementation(
      (amount: number, currency: string, locale: string) =>
        `${amount}-${currency}-${locale}`,
    );
    mockFormatFileSize.mockImplementation((value: number) => `${value} bytes`);
  });

  function loadPageModule() {
    jest.doMock("@/lib/metadata", () => ({
      createMetadata: (config: unknown) => mockCreateMetadata(config),
    }));
    jest.doMock("@/lib/auth/permissions", () => ({
      requireAuth: mockRequireAuth,
    }));
    jest.doMock("@/lib/database/subscription", () => ({
      getUserSubscription: mockGetUserSubscription,
      getUserPayments: mockGetUserPayments,
    }));
    jest.doMock("@/lib/i18n/server-locale", () => ({
      getRequestLocale: mockGetRequestLocale,
    }));
    jest.doMock("@/database", () => ({
      db: {
        select: mockDbSelect,
      },
    }));
    jest.doMock("@/database/schema", () => ({
      uploads: {
        fileSize: "uploads.fileSize",
        userId: "uploads.userId",
      },
    }));
    jest.doMock("drizzle-orm", () => ({
      count: mockCount,
      eq: mockEq,
      sum: mockSum,
    }));
    jest.doMock("@/lib/utils", () => ({
      formatCurrency: mockFormatCurrency,
    }));
    jest.doMock("@/lib/config/upload", () => ({
      formatFileSize: mockFormatFileSize,
    }));
    jest.doMock("next/link", () => ({
      __esModule: true,
      default: ({
        children,
        href,
      }: {
        children: React.ReactNode;
        href: string;
      }) => <a href={href}>{children}</a>,
    }));
    jest.doMock("./_components/dashboard-page-wrapper", () => ({
      DashboardPageWrapper: ({
        title,
        description,
        children,
      }: {
        title: string;
        description: string;
        children: React.ReactNode;
      }) => (
        <section>
          <h1>{title}</h1>
          <p>{description}</p>
          {children}
        </section>
      ),
    }));
    jest.doMock("@/components/ui/card", () => ({
      Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      CardHeader: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
      CardDescription: ({ children }: { children: React.ReactNode }) => (
        <p>{children}</p>
      ),
      CardContent: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
    }));
    jest.doMock("@/components/ui/badge", () => ({
      Badge: ({
        children,
        variant,
      }: {
        children: React.ReactNode;
        variant: string;
      }) => <span data-variant={variant}>{children}</span>,
    }));
    jest.doMock("@/components/ui/button", () => ({
      Button: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    }));
    jest.doMock("lucide-react", () => {
      const Icon = () => null;

      return {
        ArrowRight: Icon,
        CreditCard: Icon,
        Files: Icon,
        ShieldCheck: Icon,
        Sparkles: Icon,
        UserCircle2: Icon,
      };
    });

    return require("./page") as typeof import("./page");
  }

  it("generates metadata from the dashboard copy", async () => {
    const { generateMetadata } = loadPageModule();

    await expect(generateMetadata()).resolves.toMatchObject({
      title: "Dashboard",
      description: "Account overview, billing status, and starter setup progress.",
    });
    expect(mockCreateMetadata).toHaveBeenCalledWith({});
  });

  it("renders the authenticated dashboard overview with subscription, uploads, and payments", async () => {
    const { default: HomeRoute } = loadPageModule();

    render(await HomeRoute());

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Account overview, billing status, and starter setup progress.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Pro")).toHaveLength(2);
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("4096 bytes stored")).toBeInTheDocument();
    expect(screen.getAllByText("1200-usd-en-US")).toHaveLength(2);
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("super admin")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Open/ })[0]).toHaveAttribute(
      "href",
      "/dashboard/billing",
    );
    expect(screen.getByText(/succeeded/i)).toBeInTheDocument();
    expect(mockGetUserSubscription).toHaveBeenCalledWith("user-123");
    expect(mockGetUserPayments).toHaveBeenCalledWith("user-123", 5);
  });

  it("renders free-state fallbacks when the account has no subscription or payments", async () => {
    mockGetUserSubscription.mockResolvedValue(null);
    mockGetUserPayments.mockResolvedValue([]);
    mockDbSelect.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ count: 0, totalSize: null }]),
      }),
    });

    const { default: HomeRoute } = loadPageModule();

    render(await HomeRoute());

    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("No active subscription")).toBeInTheDocument();
    expect(screen.getByText("0 bytes stored")).toBeInTheDocument();
    expect(screen.getByText("No payment records yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No payment history yet. Visit billing when you are ready to test checkout.",
      ),
    ).toBeInTheDocument();
  });
});
