import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, Terminal } from "lucide-react";
import { GITHUB_URL } from "@/lib/config/constants";
import Link from "next/link";
import { ShellContainer } from "@/components/layout/page-container";
import { CopyCommand } from "@/components/homepage/copy-command";
const UI_STACK_LABEL = "Next.js 16 + shadcn/ui";
export function Hero({
  locale = SOURCE_LOCALE,
}: {
  locale?: SupportedLocale;
} = {}) {
  const { t } = getStaticTranslations(locale);
  const command = "git clone https://github.com/UllrAI/SaaS-Starter.git";
  return (
    <section className="bg-background border-border relative overflow-hidden border-b pt-24 pb-32 lg:pt-32 lg:pb-48">
      <ShellContainer className="relative z-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Side: Content */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {/* Badge */}
            <div>
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 mb-4 inline-flex cursor-default items-center gap-2 border px-4 py-2 font-mono text-sm font-bold transition-colors"
              >
                <span className="bg-primary h-2 w-2 rounded-full" />
                <>{t("home_open_source_agent_ready")}</>
              </Badge>
            </div>

            {/* Massive Headline */}
            <h1 className="text-foreground mb-6 text-5xl leading-[0.9] font-black tracking-tighter sm:text-6xl lg:text-7xl xl:text-8xl">
              <span className="block">{t("home_ship")}</span>
              <span className="text-primary block pr-1">
                {t("home_micro_saas")}
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-muted-foreground mb-10 max-w-xl text-lg leading-relaxed sm:text-xl lg:text-2xl">
              <>{t("home_complete_ullrai_saas_starter")}</>
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-4 sm:flex-row lg:gap-6">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 border-2 px-10 text-base font-bold lg:h-16 lg:px-12 lg:text-lg"
                asChild
              >
                <Link
                  href="/signup"
                  data-umami-event="signup_click"
                  data-umami-event-source="homepage_hero"
                >
                  <>{t("home_start_now")}</>
                  <Terminal className="ml-3 h-5 w-5" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="bg-background hover:bg-secondary h-14 border-2 px-10 text-base font-bold transition-colors lg:h-16 lg:px-12 lg:text-lg"
                asChild
              >
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  data-umami-event="github_source_click"
                  data-umami-event-source="homepage_hero"
                >
                  <Github className="mr-2 h-5 w-5" />
                  <>{t("home_view_source")}</>
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Side: Interface Preview */}
          <div className="perspective-container relative w-full">
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
                    {t("home_developer_console")}
                  </span>
                </div>
                <div className="text-muted-foreground hidden font-mono text-xs font-bold sm:block">
                  {t("home_user_saas_starter_projects_my_app")}
                </div>
              </div>

              {/* Window Body (Split View) */}
              <div className="bg-background grid min-h-[400px] grid-cols-1 lg:grid-cols-12">
                {/* Left: Terminal Setup */}
                <div className="border-border overflow-hidden border-b p-6 text-left font-mono text-xs sm:p-8 lg:col-span-7 lg:border-r lg:border-b-0">
                  <CopyCommand
                    command={command}
                    copyLabel={t("hero_copy_command")}
                    copiedLabel={t("hero_command_copied")}
                  />

                  <div translate="no" className="space-y-2 text-xs sm:text-xs">
                    {/* Quick Start */}
                    <div className="text-muted-foreground/65">
                      <span translate="no" className="text-green-500">
                        ➜
                      </span>{" "}
                      git clone https://github.com/UllrAI/SaaS-Starter.git
                    </div>
                    <div className="text-muted-foreground/65">
                      <span translate="no" className="text-green-500">
                        ➜
                      </span>{" "}
                      cd saas-starter
                    </div>

                    <div className="h-4" />

                    <div className="text-muted-foreground/65">
                      <span translate="no" className="text-green-500">
                        ➜
                      </span>{" "}
                      cp .env.example .env
                    </div>
                    <div className="text-muted-foreground/65">
                      <span translate="no" className="text-green-500">
                        ➜
                      </span>{" "}
                      pnpm install
                    </div>

                    <div className="h-4" />

                    <div className="text-foreground font-bold">
                      <span translate="no" className="text-primary">
                        ➜
                      </span>{" "}
                      pnpm dev
                    </div>

                    <div className="h-4" />

                    {/* Output */}
                    <div className="text-muted-foreground/65 space-y-1 pl-2">
                      <div translate="no" className="text-green-500">
                        ✓ Ready in 1.2s
                      </div>
                      <div translate="no">
                        ○ Local:{" "}
                        <span translate="no" className="text-primary underline">
                          http://localhost:3000
                        </span>
                      </div>
                    </div>

                    <div className="text-primary mt-6 flex animate-pulse items-center gap-2">
                      <span
                        translate="no"
                        className="bg-primary block h-4 w-2"
                      />
                      <span>
                        <>{t("hero_running")}</>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: What's Included */}
                <div className="bg-secondary/5 flex flex-col p-6 text-left sm:p-8 lg:col-span-5">
                  <div className="mb-6 space-y-2">
                    <div className="text-muted-foreground text-xs font-semibold">
                      <>{t("home_whats_included")}</>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-primary h-3 w-3 rounded-full" />
                      <span className="text-foreground font-bold">
                        <>{t("home_production_ready")}</>
                      </span>
                    </div>
                  </div>

                  {/* Features Grid */}
                  <div className="flex-1 space-y-4">
                    <div className="text-muted-foreground grid grid-cols-1 gap-3 pb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-primary" translate="no">
                          ✓
                        </span>
                        <span>
                          <>{t("home_authentication")}</>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary" translate="no">
                          ✓
                        </span>
                        <span>
                          <>{t("home_agent_ready_apis")}</>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary" translate="no">
                          ✓
                        </span>
                        <span>
                          <>{t("home_cli_device_auth")}</>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary" translate="no">
                          ✓
                        </span>
                        <span>
                          <>{t("home_database")}</>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary" translate="no">
                          ✓
                        </span>
                        <span>
                          <>{t("home_payments")}</>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary" translate="no">
                          ✓
                        </span>
                        <span>
                          <>{t("home_file_upload")}</>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary" translate="no">
                          ✓
                        </span>
                        <span>
                          <>{t("home_admin_panel")}</>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary" translate="no">
                          ✓
                        </span>
                        <span>
                          <>{t("home_i18n_ready")}</>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary" translate="no">
                          ✓
                        </span>
                        <span>
                          <>{t("home_e2_e_smoke_tests")}</>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-border mt-auto border-t pt-6">
                    <div className="text-muted-foreground text-xs">
                      <span className="block">{t("home_built")}</span>
                      <span
                        translate="no"
                        className="text-primary block font-mono"
                      >
                        {UI_STACK_LABEL}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ShellContainer>
    </section>
  );
}
