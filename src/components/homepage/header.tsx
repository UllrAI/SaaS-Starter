import Link from "next/link";

import { HeaderActions } from "@/components/homepage/header-actions";
import { Logo } from "@/components/logo";
import { ShellContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config/constants";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
import { withLocalePrefix } from "@/lib/config/i18n-routing";
import { getStaticTranslations } from "@/lib/i18n/translation/static";

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
      title: t("cfdb02905783", "Features"),
    },
    {
      id: "nav-pricing",
      href: withLocalePrefix("/pricing", locale),
      title: t("636e74a41e80", "Pricing"),
    },
    {
      id: "nav-about",
      href: withLocalePrefix("/about", locale),
      title: t("9310e918931e", "About"),
    },
    {
      id: "nav-blog",
      href: withLocalePrefix("/blog", locale),
      title: t("3d3e4c83a046", "Blog"),
    },
    {
      id: "nav-contact",
      href: withLocalePrefix("/contact", locale),
      title: t("1a5e08adf49a", "Contact"),
    },
  ];

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
              getStarted: t("3dd52b8e342a", "Get Started"),
              navigationMenu: t("2924b40503f8", "Navigation Menu"),
              signIn: t("6639ec6351f1", "Sign In"),
              toggleMenu: t("56980d19e13c", "Toggle menu"),
            }}
          />
        </div>
      </ShellContainer>
    </header>
  );
}
