"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

export function CallToAction() {
  const proofPoints = ["Production ready", "SOC2-friendly", "Zero setup fees"];

  return (
    <section className="border-t border-border/60 bg-accent/20">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Logo className="text-primary h-8 w-8" variant="icon-only" />
          </div>

          <div className="mx-auto mt-8 max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/80">
              Launch your SaaS in hours 
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Everything you need to ship a Micro SaaS
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
              Auth, billing, docs, and marketing pages already wired together so your next release can
              focus on the product, not the scaffolding.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            {proofPoints.map((point) => (
              <span key={point} className="inline-flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                {point}
              </span>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="group h-12 px-8 text-base font-semibold" asChild>
              <Link href="/pricing">
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base font-medium hover:bg-accent/70"
              asChild
            >
              <Link href="/features">See what&apos;s inside</Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Cancel anytime • Keep your code • Works with your current stack
          </p>
        </div>
      </div>
    </section>
  );
}
