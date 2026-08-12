export type UmamiEventData = Record<string, string | number | boolean>;

export function trackUmamiEvent(
  eventName: string,
  data?: UmamiEventData,
): void {
  if (typeof window === "undefined") return;

  window.umami?.track(eventName, data);
}
