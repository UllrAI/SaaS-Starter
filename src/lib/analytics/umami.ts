export type UmamiEventData = Record<string, string | number | boolean>;

export function trackUmamiEvent(
  eventName: string,
  data?: UmamiEventData,
): void {
  if (typeof window === "undefined") return;

  try {
    window.umami?.track(eventName, data);
  } catch {
    // Analytics must never block the product action being measured.
  }
}
