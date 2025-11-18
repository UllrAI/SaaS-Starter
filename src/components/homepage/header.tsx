"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { Session } from "@/types/auth";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, Menu, UserCircle, ExternalLink } from "lucide-react";
import { APP_NAME } from "@/lib/config/constants";

interface NavItem {
  id: string;
  title: React.ReactNode;
  href?: string;
  description?: React.ReactNode;
  items?: NavItem[];
  icon?: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
  external?: boolean;
}

const navigationItems: NavItem[] = [
  {
    id: "nav-features",
    title: <>Features</>,
    items: [
      {
        id: "nav-authentication",
        title: <>Authentication</>,
        href: "/login",
        description: <>Secure user authentication with magic links</>,
      },
      {
        id: "nav-billing",
        title: <>Billing</>,
        href: "/dashboard/settings?page=billing",
        description: <>Subscription management and payments</>,
      },
      {
        id: "nav-dashboard",
        title: <>Dashboard</>,
        href: "/dashboard",
        description: <>User dashboard and settings</>,
      },
    ],
  },
  {
    id: "nav-pricing",
    title: <>Pricing</>,
    href: "/pricing",
  },
  {
    id: "nav-about",
    title: <>About</>,
    href: "/about",
  },
  {
    id: "nav-blog",
    title: <>Blog</>,
    href: "/blog",
  },
  {
    id: "nav-contact",
    title: <>Contact</>,
    href: "/contact",
  },
];

const mobileNavItems: NavItem[] = [
  {
    id: "mobile-features",
    title: <>Features</>,
    href: "/features",
  },
  {
    id: "mobile-pricing",
    title: <>Pricing</>,
    href: "/pricing",
  },
  {
    id: "mobile-about",
    title: <>About</>,
    href: "/about",
  },
  {
    id: "mobile-blog",
    title: <>Blog</>,
    href: "/blog",
  },
  {
    id: "mobile-contact",
    title: <>Contact</>,
    href: "/contact",
  },
];

function NavigationDropdown({ item }: { item: NavItem }) {
  if (!item.items) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="text-muted-foreground data-[state=open]:text-foreground h-9 px-3 text-sm font-medium"
        >
          {item.title}
          <ChevronDown className="ml-1 h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-2" sideOffset={8}>
        {item.items.map((subItem) => {
          const IconComponent = subItem.icon;

          return (
            <DropdownMenuItem key={subItem.id} asChild>
              {subItem.href ? (
                <Link
                  href={subItem.href}
                  className="hover:bg-accent flex items-start gap-3 rounded-md p-3 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {IconComponent && (
                        <IconComponent className="text-primary h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">
                        {subItem.title}
                      </span>
                      {subItem.badge && (
                        <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-medium">
                          {subItem.badge}
                        </span>
                      )}
                      {subItem.external && (
                        <ExternalLink className="text-muted-foreground h-3 w-3" />
                      )}
                    </div>
                    {subItem.description && (
                      <p className="text-muted-foreground/80 mt-1 text-xs leading-relaxed">
                        {subItem.description}
                      </p>
                    )}
                  </div>
                </Link>
              ) : (
                <div className="flex items-start gap-3 p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {IconComponent && (
                        <IconComponent className="text-primary h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">
                        {subItem.title}
                      </span>
                      {subItem.badge && (
                        <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-medium">
                          {subItem.badge}
                        </span>
                      )}
                    </div>
                    {subItem.description && (
                      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                        {subItem.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Auth buttons component to handle loading state
function AuthButtons({
  session,
  isPending,
}: {
  session: Session | null;
  isPending: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isPending) {
    return (
      <div className="hidden items-center gap-2 md:flex">
        {/* <Skeleton className="h-8 w-16" /> */}
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
            Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 md:flex">
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">Sign In</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/signup">Get Started</Link>
      </Button>
    </div>
  );
}

// Mobile auth buttons component
function MobileAuthButtons({
  session,
  isPending,
}: {
  session: Session | null;
  isPending: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
            Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      <Button asChild className="w-full">
        <Link href="/login">Sign In</Link>
      </Button>
      <Button asChild variant="outline" className="w-full">
        <Link href="/signup">Get Started</Link>
      </Button>
    </div>
  );
}

function MobileNavigation({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data: session, isPending } = useSession();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-80 p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="border-border flex items-center gap-2 border-b p-6">
          <Logo className="text-primary h-6 w-6" variant="icon-only" />
          <span className="text-lg font-bold">{APP_NAME}</span>
        </div>

        <div className="flex flex-col p-6">
          <nav className="space-y-4">
            {mobileNavItems.map((item) => (
              <Link
                key={item.id}
                href={item.href!}
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur transition-all duration-200",
          isScrolled && "border-border/80 bg-background/80 shadow-sm",
        )}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Logo className="text-primary h-6 w-6" variant="icon-only" />
              <span className="text-foreground text-xl font-bold">
                {APP_NAME}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 md:flex">
              {navigationItems.map((item) => (
                <div key={item.id}>
                  {item.items ? (
                    <NavigationDropdown item={item} />
                  ) : (
                    <Button
                      asChild
                      variant="ghost"
                      className="h-9 px-3 text-sm font-medium"
                    >
                      <Link
                        href={item.href!}
                        className={cn(
                          "text-muted-foreground transition-colors",
                          pathname === item.href && "text-foreground",
                        )}
                      >
                        {item.title}
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Locale selector */}
              <LocaleSwitcher variant="ghost" size="icon" />
              {/* Theme toggle */}
              <ModeToggle variant="ghost" size="icon" />

              {/* Desktop CTA buttons */}
              <AuthButtons session={session} isPending={isPending} />

              {/* Mobile menu trigger */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}
