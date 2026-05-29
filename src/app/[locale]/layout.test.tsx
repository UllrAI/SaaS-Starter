import { render, screen } from "@testing-library/react";
import LocalizedMarketingLayout from "./layout";
import { resolveStaticMarketingParams } from "@/lib/i18n/static-marketing-locale";

jest.mock("@/app/(pages)/layout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pages-layout">
      <header data-testid="homepage-header">Header</header>
      <main>{children}</main>
      <footer data-testid="homepage-footer">Footer</footer>
    </div>
  ),
}));

jest.mock("@/lib/i18n/static-marketing-locale", () => ({
  getStaticMarketingLocaleParams: jest.fn(() => [{ locale: "zh-Hans" }]),
  resolveStaticMarketingParams: jest.fn(() => Promise.resolve("zh-Hans")),
}));

const mockResolveStaticMarketingParams =
  resolveStaticMarketingParams as jest.MockedFunction<
    typeof resolveStaticMarketingParams
  >;

describe("LocalizedMarketingLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("validates the locale and reuses the marketing chrome", async () => {
    const params = Promise.resolve({ locale: "zh-Hans" });
    const layout = await LocalizedMarketingLayout({
      children: <div data-testid="layout-child">Localized content</div>,
      params,
    });

    render(layout);

    expect(mockResolveStaticMarketingParams).toHaveBeenCalledWith(params);
    expect(screen.getByTestId("pages-layout")).toBeInTheDocument();
    expect(screen.getByTestId("homepage-header")).toBeInTheDocument();
    expect(screen.getByTestId("homepage-footer")).toBeInTheDocument();
    expect(screen.getByTestId("layout-child")).toBeInTheDocument();
  });
});
