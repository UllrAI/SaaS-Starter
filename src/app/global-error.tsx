"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import messages from "@/messages/en.json";
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & {
    digest?: string;
  };
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
            <h1 className="text-2xl font-semibold">
              {messages["8af07acd4b9c"]}
            </h1>
            <p className="text-muted-foreground text-sm">
              {messages["7c992548946c"]}
            </p>
            <Button onClick={reset}>{messages["06fe531548c7"]}</Button>
          </div>
        </main>
      </body>
    </html>
  );
}
