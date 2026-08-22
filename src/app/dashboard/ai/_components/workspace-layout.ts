export const DEFAULT_CANVAS_PERCENT = 50;

export const MIN_CANVAS_PERCENT = 30;
export const MAX_CANVAS_PERCENT = 70;

interface CanvasVisibilityState {
  automaticallyOpen: boolean;
  hasArtifacts: boolean;
  manuallyOpen: boolean;
  preferredOpen: boolean;
}

export function shouldOpenDesktopCanvas({
  automaticallyOpen,
  hasArtifacts,
  manuallyOpen,
  preferredOpen,
}: CanvasVisibilityState) {
  return automaticallyOpen || manuallyOpen || (preferredOpen && hasArtifacts);
}

export function clampCanvasPercent(value: number) {
  return Math.min(MAX_CANVAS_PERCENT, Math.max(MIN_CANVAS_PERCENT, value));
}

export function canvasPercentFromPointer(
  clientX: number,
  workspaceLeft: number,
  workspaceWidth: number,
) {
  if (workspaceWidth <= 0) return DEFAULT_CANVAS_PERCENT;

  return clampCanvasPercent(
    ((workspaceLeft + workspaceWidth - clientX) / workspaceWidth) * 100,
  );
}
