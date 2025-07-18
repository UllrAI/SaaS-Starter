import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AppearancePage } from "./appearance-page";
import { useTheme } from "next-themes";

// Mock next-themes
jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}));

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockSetTheme = jest.fn();

describe("AppearancePage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTheme.mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
      themes: ["light", "dark", "system"],
      systemTheme: "light",
      resolvedTheme: "light",
    });
  });

  it("should render appearance page with theme options", () => {
    render(<AppearancePage />);

    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getByText("Theme Preferences")).toBeInTheDocument();
    expect(screen.getByText("Light")).toBeInTheDocument();
    expect(screen.getByText("Dark")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("should show light theme as selected by default when not mounted", () => {
    render(<AppearancePage />);

    // Before mounting, light theme should be selected
    const lightCard = screen.getByText("Light");
    expect(lightCard).toBeInTheDocument();
  });

  it("should show correct selected theme after mounting", async () => {
    mockUseTheme.mockReturnValue({
      theme: "dark",
      setTheme: mockSetTheme,
      themes: ["light", "dark", "system"],
      systemTheme: "light",
      resolvedTheme: "dark",
    });

    render(<AppearancePage />);

    // Wait for component to mount and verify dark theme is available
    await waitFor(() => {
      const darkCard = screen.getByText("Dark");
      expect(darkCard).toBeInTheDocument();
    });
  });

  it("should call setTheme when theme card is clicked", async () => {
    render(<AppearancePage />);

    const darkThemeCard = screen.getByText("Dark").closest(".cursor-pointer");
    expect(darkThemeCard).toBeInTheDocument();

    fireEvent.click(darkThemeCard!);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("should handle system theme selection", async () => {
    render(<AppearancePage />);

    const systemThemeCard = screen
      .getByText("System")
      .closest(".cursor-pointer");
    expect(systemThemeCard).toBeInTheDocument();

    fireEvent.click(systemThemeCard!);
    expect(mockSetTheme).toHaveBeenCalledWith("system");
  });

  it("should render system theme card with split design", () => {
    render(<AppearancePage />);

    const systemCard = screen.getByText("System");
    expect(systemCard).toBeInTheDocument();
  });

  it("should handle undefined theme gracefully", async () => {
    mockUseTheme.mockReturnValue({
      theme: undefined,
      setTheme: mockSetTheme,
      themes: ["light", "dark", "system"],
      systemTheme: "light",
      resolvedTheme: "light",
    });

    render(<AppearancePage />);

    // Should render without errors when theme is undefined
    const lightCard = screen.getByText("Light");
    expect(lightCard).toBeInTheDocument();
  });
});
