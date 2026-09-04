"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { isDeploymentSkewError, reloadPage } from "@/lib/deployment-skew";
import { useTranslation } from "@/lib/i18n/translation/client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    console.error(error);
  }, [error]);
  // Sits below the dashboard root layout, so it still has the intl provider and
  // the document chrome. `src/app/error.tsx` is above every root layout and has
  // neither.
  //
  // A stale client cannot be repaired by re-rendering: `reset` would replay the
  // same missing Server Action ID, so the recovery path has to be a reload.
  const isSkew = isDeploymentSkewError(error);
  // The wrapper is a `div`, not a `main`: the dashboard layout already renders
  // this boundary inside `SidebarInset`, which is a `main` itself.
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">
          {isSkew
            ? t("common_deployment_skew_title")
            : t("common_something_went_wrong")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isSkew
            ? t("common_deployment_skew_description")
            : t("common_page_load_error")}
        </p>
        <Button onClick={isSkew ? reloadPage : reset}>
          {isSkew ? t("common_reload") : t("common_try_again")}
        </Button>
      </div>
    </div>
  );
}
