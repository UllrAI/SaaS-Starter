"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md space-y-4 text-center">
            <h1 className="text-2xl font-semibold">Application error</h1>
            <p className="text-muted-foreground text-sm">
              The app encountered a fatal error. Please retry.
            </p>
            <Button onClick={reset}>Reload</Button>
          </div>
        </main>
      </body>
    </html>
  );
}
