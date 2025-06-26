import React from "react";
import { render, screen, act } from "@testing-library/react";
import { useAnnouncement } from "./use-announcement";

// Test component to use the hook
function TestComponent() {
  const { announce, announcementRef } = useAnnouncement();

  return (
    <div>
      <div
        ref={announcementRef}
        data-testid="announcement-region"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <button
        onClick={() => announce("Test message", "polite")}
        data-testid="announce-polite"
      >
        Announce Polite
      </button>
      <button
        onClick={() => announce("Urgent message", "assertive")}
        data-testid="announce-assertive"
      >
        Announce Assertive
      </button>
      <button
        onClick={() => announce("Default message")}
        data-testid="announce-default"
      >
        Announce Default
      </button>
    </div>
  );
}

describe("useAnnouncement", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should create announcement region with correct attributes", () => {
    render(<TestComponent />);
    const region = screen.getByTestId("announcement-region");

    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
    expect(region).toHaveClass("sr-only");
  });

  it("should announce messages with polite priority", async () => {
    render(<TestComponent />);
    const region = screen.getByTestId("announcement-region");
    const button = screen.getByTestId("announce-polite");

    act(() => {
      button.click();
    });

    // Wait for the setTimeout in the hook
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveTextContent("Test message");
  });

  it("should announce messages with assertive priority", () => {
    render(<TestComponent />);
    const region = screen.getByTestId("announcement-region");
    const button = screen.getByTestId("announce-assertive");

    act(() => {
      button.click();
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(region).toHaveAttribute("aria-live", "assertive");
    expect(region).toHaveTextContent("Urgent message");
  });

  it("should default to polite priority", () => {
    render(<TestComponent />);
    const region = screen.getByTestId("announcement-region");
    const button = screen.getByTestId("announce-default");

    act(() => {
      button.click();
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveTextContent("Default message");
  });

  it("should clear and set message correctly", () => {
    render(<TestComponent />);
    const region = screen.getByTestId("announcement-region");
    const button = screen.getByTestId("announce-polite");

    act(() => {
      button.click();
    });

    // Initially cleared
    expect(region).toHaveTextContent("");

    // After timeout, should have message
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(region).toHaveTextContent("Test message");
  });

  it("should handle rapid successive announcements", () => {
    render(<TestComponent />);
    const region = screen.getByTestId("announcement-region");

    act(() => {
      screen.getByTestId("announce-polite").click();
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(region).toHaveTextContent("Test message");

    // Make another announcement
    act(() => {
      screen.getByTestId("announce-assertive").click();
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(region).toHaveTextContent("Urgent message");
    expect(region).toHaveAttribute("aria-live", "assertive");
  });

  it("should persist priority change across announcements", () => {
    render(<TestComponent />);
    const region = screen.getByTestId("announcement-region");

    act(() => {
      screen.getByTestId("announce-assertive").click();
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(region).toHaveAttribute("aria-live", "assertive");

    act(() => {
      screen.getByTestId("announce-polite").click();
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(region).toHaveAttribute("aria-live", "polite");
  });

  it("should handle empty messages gracefully", () => {
    function EmptyMessageComponent() {
      const { announce, announcementRef } = useAnnouncement();

      return (
        <div>
          <div ref={announcementRef} data-testid="announcement-region" />
          <button onClick={() => announce("")} data-testid="announce-empty">
            Announce Empty
          </button>
        </div>
      );
    }

    render(<EmptyMessageComponent />);
    const region = screen.getByTestId("announcement-region");
    const button = screen.getByTestId("announce-empty");

    act(() => {
      button.click();
    });

    expect(region).toHaveTextContent("");
  });
});
