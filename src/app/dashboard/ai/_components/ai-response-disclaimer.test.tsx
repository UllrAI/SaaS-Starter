import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AiResponseDisclaimer } from "./ai-response-disclaimer";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  configurable: true,
  value: ResizeObserverMock,
});

describe("AiResponseDisclaimer", () => {
  it("reveals the disclaimer when the info button is activated", async () => {
    const message = "AI can make mistakes. Check important information.";

    render(
      <TooltipProvider>
        <AiResponseDisclaimer message={message} />
      </TooltipProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: message }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(message);
  });
});
