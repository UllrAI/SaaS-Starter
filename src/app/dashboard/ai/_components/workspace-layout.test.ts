import { describe, expect, it } from "@jest/globals";
import {
  canvasPercentFromPointer,
  clampCanvasPercent,
  DEFAULT_CANVAS_PERCENT,
  shouldOpenDesktopCanvas,
} from "./workspace-layout";

describe("AI workspace layout", () => {
  it("keeps the canvas within usable desktop bounds", () => {
    expect(clampCanvasPercent(10)).toBe(30);
    expect(clampCanvasPercent(55)).toBe(55);
    expect(clampCanvasPercent(90)).toBe(70);
  });

  it("converts the divider position into a canvas percentage", () => {
    expect(canvasPercentFromPointer(600, 100, 1000)).toBe(50);
    expect(canvasPercentFromPointer(900, 100, 1000)).toBe(30);
    expect(canvasPercentFromPointer(200, 100, 1000)).toBe(70);
  });

  it("uses the default when the workspace has no measurable width", () => {
    expect(canvasPercentFromPointer(0, 0, 0)).toBe(DEFAULT_CANVAS_PERCENT);
  });

  it("keeps an empty canvas closed by default and restores the user choice", () => {
    expect(
      shouldOpenDesktopCanvas({
        automaticallyOpen: false,
        hasArtifacts: false,
        manuallyOpen: false,
        preferredOpen: false,
      }),
    ).toBe(false);
    expect(
      shouldOpenDesktopCanvas({
        automaticallyOpen: false,
        hasArtifacts: false,
        manuallyOpen: false,
        preferredOpen: true,
      }),
    ).toBe(false);
    expect(
      shouldOpenDesktopCanvas({
        automaticallyOpen: false,
        hasArtifacts: true,
        manuallyOpen: false,
        preferredOpen: true,
      }),
    ).toBe(true);
  });

  it("opens the canvas when requested by the current interaction", () => {
    expect(
      shouldOpenDesktopCanvas({
        automaticallyOpen: false,
        hasArtifacts: false,
        manuallyOpen: true,
        preferredOpen: false,
      }),
    ).toBe(true);
    expect(
      shouldOpenDesktopCanvas({
        automaticallyOpen: true,
        hasArtifacts: false,
        manuallyOpen: false,
        preferredOpen: false,
      }),
    ).toBe(true);
  });
});
