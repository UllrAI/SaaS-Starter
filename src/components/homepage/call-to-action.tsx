import React from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

export function CallToAction() {
  const proofPoints = [
    { id: "typed", label: <>Type-safe data flow</> },
    { id: "self-hosted", label: <>Self-hosted by default</> },
    { id: "extensible", label: <>Built to customize</> },
  ];

  return (
    <section className="border-border bg-background border-t">
      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <div className="text-center">
          <div className="border-primary bg-primary/5 mx-auto flex h-16 w-16 items-center justify-center border">
            <Logo className="text-primary h-10 w-10" variant="icon-only" />
          </div>

          <div className="mx-auto mt-10 max-w-3xl space-y-6">
            <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
              <>Ship the foundation first</>
            </p>
            <h2 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
              <>Start from a working product shell, not a blank repo</>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed sm:text-xl">
              <>
                The starter gives you auth, billing, uploads, admin pages, and
                content scaffolding so your next sprint can focus on product
                logic and customer workflows.
              </>
            </p>
          </div>

          <div className="text-muted-foreground mt-8 flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
            {proofPoints.map(({ id, label }) => (
              <span key={id} className="inline-flex items-center gap-2">
                <CheckCircle className="text-primary h-4 w-4" />
                {label}
              </span>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="group h-14 px-10 text-base font-bold shadow-lg transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-md active:translate-x-[4px] active:translate-y-[4px]"
              asChild
            >
              <Link href="/pricing">
                <>View pricing</>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="hover:bg-secondary h-14 border-2 px-10 text-base font-bold transition-colors"
              asChild
            >
              <Link href="/features">
                <>See what&apos;s inside</>
              </Link>
            </Button>
          </div>

          <p className="text-muted-foreground mt-6 text-sm">
            <>
              Own the codebase, keep the architecture, and adapt the pieces you
              actually need.
            </>
          </p>
        </div>
      </div>
    </section>
  );
}
