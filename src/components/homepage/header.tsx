"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { Session } from "@/types/auth";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ShellContainer } from "@/components/layout/page-container";
import { Menu, UserCircle } from "lucide-react";
import { APP_NAME } from "@/lib/config/constants";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  extractLocaleFromPath,
  isMarketingPath,
  withLocalePrefix,
} from "@/lib/config/i18n-routing";
interface NavItem {
  id: string;
  href: string;
  baseHref: string;
  title: React.ReactNode;
}
function getLocalizedMarketingHref(pathname: string, href: string): string {
  const pathLocale = extractLocaleFromPath(pathname);
  if (!pathLocale.locale || !isMarketingPath(href)) {
    return href;
  }
  return withLocalePrefix(href, pathLocale.locale);
}
function AuthButtons({
  session,
  isPending,
}: {
  session: Session | null;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const mounted = useHydrated();
  if (!mounted || isPending) {
    return (
      <div className="hidden items-center gap-2 md:flex">
        <Skeleton className="h-8 w-24" />
      </div>
    );
  }
  if (session?.user && session?.session) {
    return (
      <div className="hidden items-center gap-2 md:flex">
        <Button asChild size="sm">
          <Link href="/dashboard">
            <UserCircle className="mr-2 h-4 w-4" />
            <>{t("4487bd795e41", "Dashboard")}</>
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="hidden items-center gap-2 md:flex">
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">
          <>{t("6639ec6351f1", "Sign In")}</>
        </Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/signup">
          <>{t("3dd52b8e342a", "Get Started")}</>
        </Link>
      </Button>
    </div>
  );
}
function MobileAuthButtons({
  session,
  isPending,
}: {
  session: Session | null;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const mounted = useHydrated();
  if (!mounted || isPending) {
    return (
      <div className="mt-8 space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (session?.user && session?.session) {
    return (
      <div className="mt-8 space-y-3">
        <Button asChild className="w-full">
          <Link href="/dashboard">
            <UserCircle className="mr-2 h-4 w-4" />
            <>{t("c63a3265f194", "Dashboard")}</>
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="mt-8 space-y-3">
      <Button asChild className="w-full">
        <Link href="/login">
          <>{t("516b3bff6996", "Sign In")}</>
        </Link>
      </Button>
      <Button asChild variant="outline" className="w-full">
        <Link href="/signup">
          <>{t("40d88743ebcb", "Get Started")}</>
        </Link>
      </Button>
    </div>
  );
}
function MobileNavigation({
  isOpen,
  onClose,
  items,
}: {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
}) {
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-80 p-0">
        <SheetTitle className="sr-only">
          <>{t("2924b40503f8", "Navigation Menu")}</>
        </SheetTitle>
        <div className="border-border flex items-center gap-2 border-b p-6">
          <Logo className="text-primary h-6 w-6" variant="icon-only" />
          <span className="text-lg font-bold">{APP_NAME}</span>
        </div>

        <div className="flex flex-col p-6">
          <nav className="space-y-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="text-foreground hover:text-primary block py-2 text-sm font-medium transition-colors"
                onClick={onClose}
              >
                {item.title}
              </Link>
            ))}
          </nav>

          <MobileAuthButtons session={session} isPending={isPending} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
export function Header() {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const pathLocale = extractLocaleFromPath(pathname);
  const activePathname = pathLocale.locale
    ? pathLocale.strippedPathname
    : pathname;
  const homeHref = getLocalizedMarketingHref(pathname, "/");
  const navigationItems: NavItem[] = [
    {
      id: "nav-features",
      href: getLocalizedMarketingHref(pathname, "/features"),
      baseHref: "/features",
      title: <>{t("cfdb02905783", "Features")}</>,
    },
    {
      id: "nav-pricing",
      href: getLocalizedMarketingHref(pathname, "/pricing"),
      baseHref: "/pricing",
      title: <>{t("636e74a41e80", "Pricing")}</>,
    },
    {
      id: "nav-about",
      href: getLocalizedMarketingHref(pathname, "/about"),
      baseHref: "/about",
      title: <>{t("9310e918931e", "About")}</>,
    },
    {
      id: "nav-blog",
      href: getLocalizedMarketingHref(pathname, "/blog"),
      baseHref: "/blog",
      title: <>{t("3d3e4c83a046", "Blog")}</>,
    },
    {
      id: "nav-contact",
      href: getLocalizedMarketingHref(pathname, "/contact"),
      baseHref: "/contact",
      title: <>{t("1a5e08adf49a", "Contact")}</>,
    },
  ];
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const isActive = (href: string) => {
    if (href === "/") {
      return activePathname === href;
    }
    return activePathname === href || activePathname.startsWith(`${href}/`);
  };
  return (
    <>
      <header
        className={cn(
          "border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur transition-all duration-200",
          isScrolled && "border-border/80 bg-background/80 shadow-sm",
        )}
      >
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
                    className={cn(
                      "text-muted-foreground transition-colors",
                      isActive(item.baseHref) && "text-foreground",
                    )}
                  >
                    {item.title}
                  </Link>
                </Button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <LocaleSwitcher variant="ghost" size="icon" />
              <ModeToggle variant="ghost" size="icon" />
              <AuthButtons session={session} isPending={isPending} />

              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">
                  <>{t("56980d19e13c", "Toggle menu")}</>
                </span>
              </Button>
            </div>
          </div>
        </ShellContainer>
      </header>

      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        items={navigationItems}
      />
    </>
  );
}
