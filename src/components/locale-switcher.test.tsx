import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LocaleSwitcher } from "./locale-switcher";

const mockSetLocale = jest.fn();
const mockPersistLocale = jest.fn();

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

jest.mock("@/components/ui/dropdown-menu", () => {
  const React = require("react");

  return {
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
      asChild,
      children,
      onClick,
      disabled,
      className,
    }: {
      asChild?: boolean;
      children: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      className?: string;
    }) => {
      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
          className,
          "data-disabled": disabled ? "true" : "false",
        });
      }

      return (
        <button
          type="button"
          className={className}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </button>
      );
    },
  };
});

jest.mock("@/lib/i18n/locale-client", () => ({
  persistLocale: (locale: string) => mockPersistLocale(locale),
}));

jest.mock("@lingo.dev/compiler/react", () => ({
  useLingoContext: () => ({
    locale: "zh-Hans",
    setLocale: mockSetLocale,
  }),
}));

describe("LocaleSwitcher", () => {
  beforeEach(() => {
    mockSetLocale.mockReset();
    mockPersistLocale.mockReset();
  });

  it("renders a canonical marketing href for locale-prefixed pages", async () => {
    window.history.pushState({}, "", "/zh-Hans/pricing");

    render(<LocaleSwitcher showLabel />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "English" })).toHaveAttribute(
        "href",
        "/pricing",
      );
    });

    const englishLink = screen.getByRole("link", { name: "English" });
    englishLink.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(englishLink);

    expect(mockPersistLocale).toHaveBeenCalledWith("en");
    expect(mockSetLocale).not.toHaveBeenCalled();
    expect(screen.getAllByText("简体中文")).not.toHaveLength(0);
  });

  it("falls back to setLocale for non-marketing routes", async () => {
    window.history.pushState({}, "", "/dashboard");

    render(<LocaleSwitcher />);

    const englishItem = await screen.findByRole("button", { name: "English" });
    fireEvent.click(englishItem);

    await waitFor(() => {
      expect(mockSetLocale).toHaveBeenCalledWith("en");
    });

    expect(mockPersistLocale).not.toHaveBeenCalled();
  });
});
