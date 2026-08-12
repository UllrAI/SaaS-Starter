import { trackUmamiEvent } from "./umami";

describe("trackUmamiEvent", () => {
  it("forwards events when the tracker is available", () => {
    const track = jest.fn();
    window.umami = { track } as unknown as UmamiTracker;

    trackUmamiEvent("cta_click", { location: "hero" });

    expect(track).toHaveBeenCalledWith("cta_click", { location: "hero" });
  });

  it("does not fail when the tracker is unavailable", () => {
    delete window.umami;

    expect(() => trackUmamiEvent("cta_click")).not.toThrow();
  });

  it("does not fail when the third-party tracker throws", () => {
    window.umami = {
      track: jest.fn(() => {
        throw new Error("tracker unavailable");
      }),
    } as unknown as UmamiTracker;

    expect(() => trackUmamiEvent("cta_click")).not.toThrow();
  });
});
