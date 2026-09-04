"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { isDeploymentSkewError, reloadPage } from "@/lib/deployment-skew";
export default function Error({
  error,
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    console.error(error);
  }, [error]);
  // A stale client cannot be repaired by re-rendering: `reset` would replay the
  // same missing Server Action ID, so the recovery path has to be a reload.
  const isSkew = isDeploymentSkewError(error);
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
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
    </main>
  );
}
