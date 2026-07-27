"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { MarketingNavItem } from "@/components/homepage/header";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useSession } from "@/lib/auth/client";
import { APP_NAME } from "@/lib/config/constants";

type HeaderLabels = {
  dashboard: string;
  getStarted: string;
  navigationMenu: string;
  signIn: string;
  toggleMenu: string;
};

function AuthButtons({
  isAuthenticated,
  isPending,
  labels,
}: {
  isAuthenticated: boolean;
  isPending: boolean;
  labels: HeaderLabels;
}) {
  if (isAuthenticated) {
    return (
      <div className="hidden items-center md:flex">
        <Button asChild size="sm">
          <Link href="/dashboard">{labels.dashboard}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      aria-hidden={isPending}
      className={`hidden items-center gap-2 md:flex ${isPending ? "invisible" : ""}`}
    >
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">{labels.signIn}</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/signup">{labels.getStarted}</Link>
      </Button>
    </div>
  );
}

function MobileAuthButtons({
  isAuthenticated,
  isPending,
  labels,
}: {
  isAuthenticated: boolean;
  isPending: boolean;
  labels: HeaderLabels;
}) {
  if (isAuthenticated) {
    return (
      <div className="mt-8">
        <Button asChild className="w-full">
          <Link href="/dashboard">{labels.dashboard}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      aria-hidden={isPending}
      className={`mt-8 space-y-3 ${isPending ? "invisible" : ""}`}
    >
      <Button asChild className="w-full">
        <Link href="/login">{labels.signIn}</Link>
      </Button>
      <Button asChild variant="outline" className="w-full">
        <Link href="/signup">{labels.getStarted}</Link>
      </Button>
    </div>
  );
}

export function HeaderActions({
  labels,
  navigationItems,
}: {
  labels: HeaderLabels;
  navigationItems: MarketingNavItem[];
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, isPending } = useSession();
  const isAuthenticated = Boolean(session?.user);

  return (
    <div className="flex items-center gap-3">
      <LocaleSwitcher variant="ghost" size="icon" />
      <ModeToggle variant="ghost" size="icon" />
      <AuthButtons
        isAuthenticated={isAuthenticated}
        isPending={isPending}
        labels={labels}
      />

      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        onClick={() => setIsMobileMenuOpen(true)}
        aria-label={labels.toggleMenu}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="right" className="w-80 p-0">
          <SheetTitle className="sr-only">{labels.navigationMenu}</SheetTitle>
          <div className="border-border flex items-center gap-2 border-b p-6">
            <Logo className="text-primary h-6 w-6" variant="icon-only" />
            <span className="text-lg font-bold">{APP_NAME}</span>
          </div>

          <div className="flex flex-col p-6">
            <nav className="space-y-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="text-foreground hover:text-primary block py-2 text-sm font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
            </nav>

            <MobileAuthButtons
              isAuthenticated={isAuthenticated}
              isPending={isPending}
              labels={labels}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
