import { useTranslations } from "next-intl";

export function useTranslation() {
  return {
    t: useTranslations(),
  };
}
