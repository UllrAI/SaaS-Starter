import Link from "next/link";

import { HeaderActions } from "@/components/homepage/header-actions";
import { Logo } from "@/components/logo";
import { ShellContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config/constants";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
import { withLocalePrefix } from "@/lib/config/i18n-routing";
import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { SITE_CONFIG } from "@/lib/config/site";

export type MarketingNavItem = {
  id: string;
  href: string;
  title: string;
};

export function Header({
  locale = SOURCE_LOCALE,
}: {
  locale?: SupportedLocale;
} = {}) {
  const { t } = getStaticTranslations(locale);
  const homeHref = withLocalePrefix("/", locale);
  const navigationItems: MarketingNavItem[] = [
    {
      id: "nav-features",
      href: withLocalePrefix("/features", locale),
      title: t("home_features"),
    },
    {
      id: "nav-pricing",
      href: withLocalePrefix("/pricing", locale),
      title: t("home_pricing_title"),
    },
    {
      id: "nav-about",
      href: withLocalePrefix("/about", locale),
      title: t("home_about"),
    },
    {
      id: "nav-blog",
      href: withLocalePrefix("/blog", locale),
      title: t("home_blog"),
    },
    {
      id: "nav-contact",
      href: withLocalePrefix("/contact", locale),
      title: t("home_contact"),
    },
  ].filter((item) => SITE_CONFIG.features.billing || item.id !== "nav-pricing");

  return (
    <header className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <ShellContainer>
        <div className="flex h-16 items-center justify-between">
          <Link href={homeHref} className="flex items-center gap-2">
            <Logo className="text-primary h-6 w-6" variant="icon-only" />
            <span className="text-foreground text-xl font-bold">
              {APP_NAME}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                asChild
                variant="ghost"
                className="h-9 px-3 text-sm font-medium"
              >
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.title}
                </Link>
              </Button>
            ))}
          </nav>

          <HeaderActions
            navigationItems={navigationItems}
            labels={{
              dashboard: t("header_dashboard"),
              getStarted: t("home_get_started"),
              navigationMenu: t("home_navigation_menu"),
              signIn: t("home_sign_in"),
              toggleMenu: t("home_toggle_menu"),
            }}
          />
        </div>
      </ShellContainer>
    </header>
  );
}
