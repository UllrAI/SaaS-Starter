"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, Terminal, Copy, Check } from "lucide-react";
import { GITHUB_URL } from "@/lib/config/constants";
import Link from "next/link";

export function Hero() {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const command = "git clone https://github.com/UllrAI/SaaS-Starter.git";

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-background border-border relative overflow-hidden border-b pt-24 pb-32 lg:pt-32 lg:pb-48">
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Side: Content */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {/* Badge */}
            <div
              className={`transform transition-all duration-1000 ${mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
            >
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 mb-4 inline-flex cursor-default items-center gap-2 border px-4 py-2 font-mono text-sm font-bold transition-colors"
              >
                <span className="relative flex h-2 w-2">
                  <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                  <span className="bg-primary relative inline-flex h-2 w-2 rounded-full"></span>
                </span>
                <>OpenSource READY</>
              </Badge>
            </div>

            {/* Massive Headline */}
            <h1
              className={`text-foreground mb-6 transform text-5xl leading-[0.9] font-black tracking-tighter transition-all delay-100 duration-1000 sm:text-6xl lg:text-7xl xl:text-8xl ${mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
            >
              <>SHIP YOUR</>
              <br />
              <span className="from-foreground to-foreground/50 bg-gradient-to-b bg-clip-text pr-1 text-transparent">
                MICRO SaaS
              </span>
            </h1>

            {/* Subtext */}
            <p
              className={`text-muted-foreground mb-10 max-w-xl transform text-lg leading-relaxed transition-all delay-200 duration-1000 sm:text-xl lg:text-2xl ${mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
            >
              Complete UllrAI SaaS starter with authentication, payments,
              database, and deployment. Everything you need to go from idea to
              revenue.
            </p>

            {/* CTAs */}
            <div
              className={`flex transform flex-col gap-4 transition-all delay-300 duration-1000 sm:flex-row lg:gap-6 ${mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
            >
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-10 text-base font-bold shadow-xl transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-lg active:translate-x-[8px] active:translate-y-[8px] lg:h-16 lg:px-12 lg:text-lg"
                asChild
              >
                <Link href="/signup">
                  START NOW
                  <Terminal className="ml-3 h-5 w-5" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="bg-background hover:bg-secondary h-14 border-2 px-10 text-base font-bold transition-colors lg:h-16 lg:px-12 lg:text-lg"
                asChild
              >
                <Link href={GITHUB_URL} target="_blank">
                  <Github className="mr-2 h-5 w-5" />
                  VIEW SOURCE
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Side: Interface Preview */}
          <div
            className={`perspective-container relative w-full transform transition-all delay-500 duration-1000 ${mounted ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}
          >
            {/* Main Window Interface */}
            <div className="border-foreground bg-card interface-3d group relative border-2 shadow-[24px_24px_0px_0px_var(--primary)]">
              {/* Window Header */}
              <div className="border-foreground bg-secondary flex items-center justify-between border-b-2 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="bg-foreground h-3 w-3" />
                    <div className="bg-foreground/50 h-3 w-3" />
                    <div className="bg-foreground/25 h-3 w-3" />
                  </div>
                  <div className="bg-foreground/20 mx-2 h-6 w-px" />
                  <span className="text-foreground flex items-center gap-2 font-mono text-sm font-bold">
                    <Terminal className="h-4 w-4" />
                    developer-console
                  </span>
                </div>
                <div className="text-muted-foreground hidden font-mono text-xs font-bold sm:block">
                  user@saas-starter:~/projects/my-app
                </div>
              </div>

              {/* Window Body (Split View) */}
              <div className="bg-background grid min-h-[400px] grid-cols-1 lg:grid-cols-12">
                {/* Left: Terminal Setup */}
                <div className="border-border overflow-hidden border-b p-6 text-left font-mono text-xs sm:p-8 lg:col-span-7 lg:border-r lg:border-b-0">
                  <div className="bg-secondary/30 border-border mb-6 flex items-center justify-between gap-4 border border-dashed p-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-primary font-bold">➜</span>
                      <span className="text-foreground truncate font-bold">
                        {command}
                      </span>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="text-muted-foreground hover:text-primary flex-shrink-0 transition-colors"
                    >
                      {copied ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <div data-lingo-skip className="space-y-2 text-xs sm:text-xs">
                    {/* Quick Start */}
                    <div className="text-muted-foreground/65">
                      <span data-lingo-skip className="text-green-500">➜</span> git clone https://github.com/UllrAI/SaaS-Starter.git
                    </div>
                    <div className="text-muted-foreground/65">
                      <span data-lingo-skip className="text-green-500">➜</span> cd saas-starter
                    </div>

                    <div className="h-4" />

                    <div className="text-muted-foreground/65">
                      <span data-lingo-skip className="text-green-500">➜</span> cp .env.example .env
                    </div>
                    <div className="text-muted-foreground/65">
                      <span data-lingo-skip className="text-green-500">➜</span> pnpm install
                    </div>

                    <div className="h-4" />

                    <div className="text-foreground font-bold">
                      <span data-lingo-skip className="text-primary">➜</span> pnpm dev
                    </div>

                    <div className="h-4" />

                    {/* Output */}
                    <div className="text-muted-foreground/65 space-y-1 pl-2">
                      <div data-lingo-skip className="text-green-500">✓ Ready in 1.2s</div>
                      <div data-lingo-skip>
                        ○ Local:{" "}
                        <span data-lingo-skip className="text-primary underline">
                          http://localhost:3000
                        </span>
                      </div>
                    </div>

                    <div className="text-primary mt-6 flex animate-pulse items-center gap-2">
                      <span data-lingo-skip className="bg-primary block h-4 w-2" />
                      <span>Running...</span>
                    </div>
                  </div>
                </div>

                {/* Right: What's Included */}
                <div className="bg-secondary/5 flex flex-col p-6 text-left sm:p-8 lg:col-span-5">
                  <div className="mb-6 space-y-2">
                    <div className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                      What&apos;s Included
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-primary h-3 w-3 rounded-full" />
                      <span className="text-foreground font-bold">
                        Production Ready
                      </span>
                    </div>
                  </div>

                  {/* Features Grid */}
                  <div className="flex-1 space-y-4">
                    <div className="text-muted-foreground grid grid-cols-1 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span>Authentication</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span>Database</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span>Payments</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span>File Upload</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span>Admin Panel</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span>i18n Ready</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-border mt-auto border-t pt-6">
                    <div className="text-muted-foreground text-xs">
                      <>Built with</><br />
                      <span data-lingo-skip className="text-primary font-mono">Next.js 16</span>
                      <>&nbsp;</><>+</><>&nbsp;</>
                      <span data-lingo-skip className="text-primary font-mono">shadcn/ui</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
