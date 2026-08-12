"use client";

import { useEffect } from "react";
import { trackUmamiEvent } from "@/lib/analytics/umami";

const MAX_TRACKING_ATTEMPTS = 20;
const RETRY_DELAY_MS = 250;

export function SignupSuccessTracker() {
  useEffect(() => {
    const url = new URL(window.location.href);

    if (url.searchParams.get("signup") !== "success") {
      return;
    }

    url.searchParams.delete("signup");
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );

    let attempt = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const sendEvent = () => {
      attempt += 1;

      if (window.umami) {
        trackUmamiEvent("signup_success");
        return;
      }

      if (attempt < MAX_TRACKING_ATTEMPTS) {
        timeoutId = setTimeout(sendEvent, RETRY_DELAY_MS);
      }
    };

    sendEvent();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
