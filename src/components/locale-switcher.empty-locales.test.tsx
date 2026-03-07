import type React from "react";
import { render } from "@testing-library/react";

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

jest.mock("@/lib/config/i18n", () => ({
  SUPPORTED_LOCALES: [],
  getLocaleDisplayInfo: () => ({
    nativeName: "English",
  }),
}));

jest.mock("@/lib/config/i18n-routing", () => ({
  normalizeLocaleCandidate: () => null,
}));

jest.mock("@/lib/i18n/locale-client", () => ({
  persistLocale: jest.fn(),
}));

jest.mock("@/lib/i18n/locale-switch", () => ({
  resolveLocaleSwitchUrl: () => null,
}));

jest.mock("@lingo.dev/compiler/react", () => ({
  useLingoContext: () => ({
    locale: null,
    setLocale: jest.fn(),
  }),
}));

import { LocaleSwitcher } from "./locale-switcher";

describe("LocaleSwitcher empty locale set", () => {
  it("returns null when no locale is available from props or config", () => {
    const { container } = render(<LocaleSwitcher />);

    expect(container).toBeEmptyDOMElement();
  });
});
