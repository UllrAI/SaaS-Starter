"use client";

import { useCallback, useRef } from "react";

/**
 * Hook for making announcements to screen readers using ARIA live regions
 */
export function useAnnouncement() {
  const announcementRef = useRef<HTMLDivElement>(null);

  const announce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      if (announcementRef.current) {
        // Clear the announcement first to ensure the new message is read
        announcementRef.current.textContent = "";

        // Use setTimeout to ensure the screen reader picks up the change
        setTimeout(() => {
          if (announcementRef.current) {
            announcementRef.current.textContent = message;
            announcementRef.current.setAttribute("aria-live", priority);
          }
        }, 100);
      }
    },
    [],
  );

  return { announce, announcementRef };
}
