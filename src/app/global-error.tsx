"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { isDeploymentSkewError, reloadPage } from "@/lib/deployment-skew";
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
  // `reset` re-runs the same stale client bundle, so a deployment skew needs a
  // reload to pull the current one.
  const isSkew = isDeploymentSkewError(error);
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md space-y-4 text-center">
            <h1 className="text-2xl font-semibold">
              {isSkew
                ? messages["common_deployment_skew_title"]
                : messages["common_application_error"]}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isSkew
                ? messages["common_deployment_skew_description"]
                : messages["common_fatal_error_retry"]}
            </p>
            <Button onClick={isSkew ? reloadPage : reset}>
              {isSkew
                ? messages["common_reload"]
                : messages["common_try_again"]}
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
