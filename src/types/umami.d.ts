interface UmamiTracker {
  track(): void;
  track(
    eventName: string,
    data?: Record<string, string | number | boolean>,
  ): void;
  track(
    callback: (properties: Record<string, unknown>) => Record<string, unknown>,
  ): void;
  identify(id: string, data?: Record<string, unknown>): void;
  identify(data: Record<string, unknown>): void;
}

interface Window {
  umami?: UmamiTracker;
}
