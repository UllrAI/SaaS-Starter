"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Github,
  Star,
  Users,
  Zap,
  CheckCircle,
  Shield,
  Sparkles,
  BowArrow,
  Activity,
} from "lucide-react";
import { GITHUB_URL } from "@/lib/config/constants";
import Link from "next/link";

interface TrustIndicator {
  id: string;
  label: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

const trustIndicators: TrustIndicator[] = [
  {
    id: "production-ready",
    label: <>Production Ready</>,
    icon: CheckCircle,
    accent: "text-emerald-500",
  },
  {
    id: "enterprise-security",
    label: <>Enterprise Security</>,
    icon: Shield,
    accent: "text-blue-500",
  },
  {
    id: "lightning-fast",
    label: <>Lightning Fast</>,
    icon: Zap,
    accent: "text-yellow-500",
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-background">
      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,1fr)_520px]">
          {/* Left Content */}
          <div className="space-y-10">
            {/* Status Badge */}
            <div className="inline-flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
              <span className="border-border/60 bg-background/70 inline-flex items-center gap-2 rounded-full border px-3 py-1">
                <Sparkles className="text-primary h-3 w-3" />
                Fresh release
              </span>
              <span className="text-muted-foreground">Trusted by 10,000+ devs</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-6">
              <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Build & Launch
                <span className="text-primary/90 block">Micro SaaS in hours</span>
              </h1>

              <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed sm:text-xl">
                Complete UllrAI Micro SaaS starter with authentication, payments,
                database, and deployment.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-3 text-sm">
              {trustIndicators.map(({ id, label, icon: Icon, accent }) => (
                <span key={id} className="flex items-center gap-2">
                  <Icon className={`${accent} h-4 w-4`} />
                  {label}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 pt-2 sm:flex-row">
              <Button
                size="lg"
                className="group h-12 px-8 text-base font-medium"
                asChild
              >
                <Link href="/signup">
                  Start Building
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="group border-border hover:bg-accent/70 h-12 px-8 text-base font-medium"
                asChild
              >
                <Link href={GITHUB_URL} target="_blank">
                  <Github className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                  View on GitHub
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="text-muted-foreground flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-foreground">4.9/5</span>
                <span>average rating</span>
              </div>
              <div className="bg-border h-4 w-px" />
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>10,000+ developers shipped with us</span>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative lg:order-last">
            <div className="absolute -left-6 top-10 hidden h-48 w-48 rounded-full bg-primary/30 opacity-60 blur-3xl lg:block" />
            <div className="border-border/60 bg-background/70 relative mx-auto max-w-lg rounded-2xl border p-6 shadow-2xl backdrop-blur-lg">
              {/* Header */}
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                    <BowArrow className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">UllrAI Dashboard</p>
                    <p className="text-muted-foreground text-xs">Demo metrics</p>
                  </div>
                </div>
                <div className="bg-emerald-500/10 text-emerald-500 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
                  <Activity className="h-3.5 w-3.5" />
                  Demo
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border-border/70 rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Monthly revenue</p>
                  <p className="text-foreground mt-2 text-2xl font-semibold">$84.2k</p>
                  <p className="text-emerald-500 text-xs font-medium">+18% vs last month</p>
                </div>
                <div className="border-border/70 rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Active users</p>
                  <p className="text-foreground mt-2 text-2xl font-semibold">12.4k</p>
                  <p className="text-blue-500 text-xs font-medium">+1.2k this week</p>
                </div>
              </div>

              {/* Chart Area */}
              <div className="border-border/60 mt-6 rounded-2xl border p-4">
                <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Deployments</span>
                  <span>Past 7 days</span>
                </div>
                <div className="flex h-24 items-end gap-2">
                  {[40, 60, 45, 80, 55, 70, 85].map((height, i) => (
                    <div
                      key={i}
                      className="bg-primary/30 flex-1 rounded-sm"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Success rate</span>
                    <span className="font-semibold text-foreground">99.9%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Build time</span>
                    <span className="font-semibold text-foreground">1m 42s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="border-border/70 bg-background absolute -top-5 right-4 rounded-xl border px-4 py-3 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-medium">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Easy Setup
              </div>
            </div>

            <div className="border-border/70 bg-background absolute -bottom-5 -left-4 rounded-xl border px-4 py-3 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Zap className="text-yellow-500 h-3.5 w-3.5" />
                Fast Deploy
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
