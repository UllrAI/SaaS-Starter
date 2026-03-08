"use client";

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

interface NavItem {
  id: string;
  href: string;
  title: React.ReactNode;
}

function AuthButtons({
  session,
  isPending,
}: {
  session: Session | null;
  isPending: boolean;
}) {
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
            <>Dashboard</>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 md:flex">
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">
          <>Sign In</>
        </Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/signup">
          <>Get Started</>
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
            <>Dashboard</>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      <Button asChild className="w-full">
        <Link href="/login">
          <>Sign In</>
        </Link>
      </Button>
      <Button asChild variant="outline" className="w-full">
        <Link href="/signup">
          <>Get Started</>
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
  const { data: session, isPending } = useSession();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-80 p-0">
        <SheetTitle className="sr-only">
          <>Navigation Menu</>
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const navigationItems: NavItem[] = [
    { id: "nav-features", href: "/features", title: <>Features</> },
    { id: "nav-pricing", href: "/pricing", title: <>Pricing</> },
    { id: "nav-about", href: "/about", title: <>About</> },
    { id: "nav-blog", href: "/blog", title: <>Blog</> },
    { id: "nav-contact", href: "/contact", title: <>Contact</> },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
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
            <Link href="/" className="flex items-center gap-2">
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
                      isActive(item.href) && "text-foreground",
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
                  <>Toggle menu</>
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
