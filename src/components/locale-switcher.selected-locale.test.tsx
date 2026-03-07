import type React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

const mockSetLocale = jest.fn();

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
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock("@/lib/config/i18n", () => ({
  SUPPORTED_LOCALES: ["en"],
  getLocaleDisplayInfo: () => ({
    nativeName: "English",
  }),
}));

jest.mock("@/lib/config/i18n-routing", () => ({
  normalizeLocaleCandidate: () => "en",
}));

jest.mock("@/lib/i18n/locale-client", () => ({
  persistLocale: jest.fn(),
}));

jest.mock("@/lib/i18n/locale-switch", () => ({
  resolveLocaleSwitchUrl: () => null,
}));

jest.mock("@lingo.dev/compiler/react", () => ({
  useLingoContext: () => ({
    locale: "en",
    setLocale: mockSetLocale,
  }),
}));

import { LocaleSwitcher } from "./locale-switcher";

describe("LocaleSwitcher current locale selection", () => {
  beforeEach(() => {
    mockSetLocale.mockReset();
  });

  it("returns early when the current locale is selected again", () => {
    render(<LocaleSwitcher locales={["en"]} />);

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(mockSetLocale).not.toHaveBeenCalled();
  });
});
