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
          {t("7b0c2ef95924", "Something went wrong")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t(
            "2b35c90beb98",
            "An unexpected error occurred while loading this page.",
          )}
        </p>
        <Button onClick={reset}>{t("26fd1c86db66", "Try again")}</Button>
      </div>
    </main>
  );
}
