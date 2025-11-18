"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth/client";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

interface SessionGuardProps {
  children: React.ReactNode;
}

export function SessionGuard({ children }: SessionGuardProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (session?.user) {
      hasRedirectedRef.current = false;
      return;
    }

    if (hasRedirectedRef.current) {
      return;
    }

    hasRedirectedRef.current = true;

    if (pathname.startsWith("/dashboard")) {
      toast.error("Your session has expired. Please log in again.");
      router.replace("/login");
    }
  }, [session, isPending, router, pathname]);

  if (isPending || !session?.user) {
    return <SessionGuardLoading />;
  }

  return <>{children}</>;
}

function SessionGuardLoading() {
  return (
    // Match the rounded corners from SidebarInset so the overlay doesn't bleed past them.
    <section className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-2xl">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="bg-primary/10 absolute inset-0 animate-pulse rounded-full" />
          <div className="border-border bg-background/50 relative flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-sm">
            <Loader2 className="text-primary h-5 w-5 animate-spin" />
          </div>
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Sparkles className="text-primary h-3 w-3 animate-pulse" />
          <span>Loading...</span>
        </div>
      </div>
    </section>
  );
}
