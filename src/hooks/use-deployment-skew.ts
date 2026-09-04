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
 *
 * `undefined` is the skew signal, so this only suits actions that resolve to an
 * object — wrapping one that can legitimately return `undefined`, `false` or
 * `0` would make callers mistake a real result for a skew.
 *
 * Pass `onSkew` from anywhere the call happens inside a dialog: Radix traps
 * focus and marks everything outside the dialog `aria-hidden`, which would put
 * the reload prompt out of reach for keyboard and screen reader users. The
 * dialog cannot preserve the user's input across the reload anyway.
 */
export function useDeploymentSkewGuard() {
  const { t } = useTranslation();
  const translateRef = useRef(t);

  useEffect(() => {
    translateRef.current = t;
  }, [t]);

  return useCallback(
    async <T>(
      run: () => Promise<T>,
      onSkew?: () => void,
    ): Promise<T | undefined> => {
      try {
        return await run();
      } catch (error) {
        if (!isDeploymentSkewError(error)) {
          throw error;
        }
        onSkew?.();
        // Named `t` so the catalog integrity test picks these keys up.
        const t = translateRef.current;
        toast.warning(t("common_deployment_skew_title"), {
          id: SKEW_TOAST_ID,
          description: t("common_deployment_skew_description"),
          duration: Infinity,
          // A dialog closing through `onSkew` restores body pointer events only
          // after its exit transition, and sonner never sets them itself, so
          // the reload button needs this to stay clickable in between.
          className: "pointer-events-auto",
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
