import { renderHook } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

// Mock window.innerWidth
Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: 1024,
});

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

Object.defineProperty(window, "addEventListener", {
  writable: true,
  configurable: true,
  value: mockAddEventListener,
});

Object.defineProperty(window, "removeEventListener", {
  writable: true,
  configurable: true,
  value: mockRemoveEventListener,
});

describe("useIsMobile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return false for desktop width (>= 768px)", () => {
    // Set desktop width
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("should return true for mobile width (< 768px)", () => {
    // Set mobile width
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("should return true for exactly 767px (mobile breakpoint)", () => {
    // Set width to exactly mobile breakpoint
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 767,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("should return false for exactly 768px (desktop breakpoint)", () => {
    // Set width to exactly desktop breakpoint
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 768,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("should subscribe to resize events", () => {
    renderHook(() => useIsMobile());
    expect(mockAddEventListener).toHaveBeenCalledWith(
      "resize",
      expect.any(Function),
    );
  });

  it("should unsubscribe from resize events on unmount", () => {
    const { unmount } = renderHook(() => useIsMobile());

    // Get the callback function that was passed to addEventListener
    const resizeCallback = mockAddEventListener.mock.calls[0][1];

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      "resize",
      resizeCallback,
    );
  });

  it("should return false for SSR (when window is undefined)", () => {
    // Mock SSR environment
    const originalWindow = global.window;
    (global as { window?: Window }).window = undefined;

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Restore window
    global.window = originalWindow;
  });
});
