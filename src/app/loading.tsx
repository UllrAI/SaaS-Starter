"use client";

import { Loader2, Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <section className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform">
      <div className="flex flex-col items-center gap-4">
        {/* Animated loader with backdrop */}
        <div className="relative">
          <div className="bg-primary/10 absolute inset-0 animate-pulse rounded-full" />
          <div className="border-border bg-background/50 relative flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-sm">
            <Loader2 className="text-primary h-5 w-5 animate-spin" />
          </div>
        </div>

        {/* Loading text */}
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Sparkles className="text-primary h-3 w-3 animate-pulse" />
          <span>Loading...</span>
        </div>
      </div>
    </section>
  );
}
