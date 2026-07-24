import { useTranslations } from "next-intl";

import { createAppTranslate } from "@/lib/i18n/translation/shared";

export function useTranslation() {
  const translator = useTranslations();

  return {
    t: createAppTranslate(translator),
  };
}
