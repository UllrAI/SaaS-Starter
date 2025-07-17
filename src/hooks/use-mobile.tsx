"use client";

import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * A hook to determine if the current viewport is mobile-sized.
 * It safely handles server-side rendering by initially returning false,
 * and then updating to the correct value on the client after mounting.
 * This prevents hydration errors.
 * @returns {boolean} - True if the viewport width is less than 768px, otherwise false.
 */
export function useIsMobile(): boolean {
  // FIX: Default to `false` on the server and for the initial client render.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // This function will only run on the client, after the component has mounted.
    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Check on mount
    checkDevice();

    // Add resize event listener
    window.addEventListener("resize", checkDevice);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount.

  return isMobile;
}
