"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
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
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">
          {t("common_something_went_wrong", "Something went wrong")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t(
            "common_unexpected_error_occurred_while_loading_page",
            "An unexpected error occurred while loading this page.",
          )}
        </p>
        <Button onClick={reset}>{t("common_try_again", "Try again")}</Button>
      </div>
    </main>
  );
}
