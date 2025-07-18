"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem("cookieConsent");
    if (!hasConsented) {
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setShowConsent(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookieConsent", "declined");
    // Here you would implement logic to disable non-essential cookies
    setShowConsent(false);
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
            onClick={() => setShowConsent(false)}
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
