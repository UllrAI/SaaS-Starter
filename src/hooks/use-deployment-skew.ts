"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

import { isDeploymentSkewError, reloadPage } from "@/lib/deployment-skew";
import { useTranslation } from "@/lib/i18n/translation/client";

// One toast at a time: repeated clicks after a deployment would otherwise stack
// identical prompts.
const SKEW_TOAST_ID = "deployment-skew";

/**
 * Wraps a Server Action call so a deployment skew becomes a reload prompt and
 * resolves to `undefined`; every other error is rethrown untouched. The
 * returned function keeps a stable identity so callers can list it in effect
 * dependencies without re-running them.
 */
export function useDeploymentSkewGuard() {
  const { t } = useTranslation();
  const translateRef = useRef(t);

  useEffect(() => {
    translateRef.current = t;
  }, [t]);

  return useCallback(
    async <T>(run: () => Promise<T>): Promise<T | undefined> => {
      try {
        return await run();
      } catch (error) {
        if (!isDeploymentSkewError(error)) {
          throw error;
        }
        // Named `t` so the catalog integrity test picks these keys up.
        const t = translateRef.current;
        toast.warning(t("common_deployment_skew_title"), {
          id: SKEW_TOAST_ID,
          description: t("common_deployment_skew_description"),
          duration: Infinity,
          action: {
            label: t("common_reload"),
            onClick: reloadPage,
          },
        });
        return undefined;
      }
    },
    [],
  );
}
