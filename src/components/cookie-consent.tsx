"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";

const COOKIE_CONSENT_KEY = "cookieConsent";

export function CookieConsent() {
  const hydrated = useHydrated();
  const [dismissed, setDismissed] = useState(false);

  const storedConsent = hydrated
    ? localStorage.getItem(COOKIE_CONSENT_KEY)
    : null;
  const showConsent = hydrated && !dismissed && !storedConsent;

  const acceptCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setDismissed(true);
  };

  const declineCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    // Here you would implement logic to disable non-essential cookies
    setDismissed(true);
  };

  if (!showConsent) return null;

  return (
    <div className="bg-background border-border fixed right-0 bottom-0 left-0 z-50 border-t p-4 shadow-lg">
      <div className="container mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h3 className="mb-1 text-base font-medium">We value your privacy</h3>
          <p className="text-muted-foreground text-sm">
            We use cookies to enhance your browsing experience, serve
            personalized items or content, and analyze our traffic. By clicking
            &quot;Accept All&quot;, you consent to our use of cookies.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={declineCookies}
            className="border-border hover:bg-accent rounded-md border px-4 py-2 text-sm transition-colors"
          >
            Essential Only
          </button>
          <button
            onClick={acceptCookies}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm transition-colors"
          >
            Accept All
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="hover:bg-accent rounded-md p-1 transition-colors"
            aria-label="Close cookie notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
