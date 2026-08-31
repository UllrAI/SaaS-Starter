import { Github, Heart, Mail, Twitter } from "lucide-react";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ShellContainer } from "@/components/layout/page-container";
import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";
import {
  APP_NAME,
  COMPANY_NAME,
  CONTACT_EMAIL,
  GITHUB_DISCUSSIONS_URL,
  GITHUB_ISSUES_URL,
  GITHUB_RELEASES_URL,
  GITHUB_URL,
  TWITTERACCOUNT,
} from "@/lib/config/constants";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
import { withLocalePrefix } from "@/lib/config/i18n-routing";
import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { SITE_CONFIG } from "@/lib/config/site";

type FooterLink = {
  id: string;
  href: string;
  label: ReactNode;
  external?: boolean;
};

type FooterSection = {
  id: string;
  title: ReactNode;
  links: FooterLink[];
};

type SocialLink = {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

function FooterLinkItem({ link }: { link: FooterLink }) {
  const className =
    "text-sm text-muted-foreground transition-colors hover:text-foreground";

  return link.external ? (
    <a
      href={link.href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
    >
      {link.label}
    </a>
  ) : (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

export function Footer({
  locale = SOURCE_LOCALE,
}: {
  locale?: SupportedLocale;
} = {}) {
  const { t } = getStaticTranslations(locale);
  const currentYear = new Date().getFullYear();
  const sections: FooterSection[] = [
    {
      id: "product",
      title: t("home_product"),
      links: [
        {
          id: "features",
          href: withLocalePrefix("/features", locale),
          label: t("home_features"),
        },
        {
          id: "pricing",
          href: withLocalePrefix("/pricing", locale),
          label: t("home_pricing"),
        },
        {
          id: "blog",
          href: withLocalePrefix("/blog", locale),
          label: t("home_blog"),
        },
        {
          id: "changelog",
          href: GITHUB_RELEASES_URL,
          label: t("home_changelog"),
          external: true,
        },
      ].filter((link) => SITE_CONFIG.features.billing || link.id !== "pricing"),
    },
    {
      id: "other-products",
      title: t("home_other_products"),
      links: [
        {
          id: "pixmiller",
          href: "https://pixmiller.com/",
          label: "PixMiller",
          external: true,
        },
        {
          id: "headshots",
          href: "https://headshots.fun/",
          label: "HeadShots.fun",
          external: true,
        },
        {
          id: "to-markdown",
          href: "https://to-markdown.com/",
          label: "To Markdown",
          external: true,
        },
        {
          id: "vibesku",
          href: "https://vibesku.com/",
          label: "VibeSKU.com",
          external: true,
        },
      ],
    },
    {
      id: "project",
      title: t("home_project"),
      links: [
        {
          id: "about",
          href: withLocalePrefix("/about", locale),
          label: t("home_about"),
        },
        {
          id: "contact",
          href: withLocalePrefix("/contact", locale),
          label: t("home_contact"),
        },
        {
          id: "github",
          href: GITHUB_URL,
          label: t("home_git_hub"),
          external: true,
        },
      ],
    },
    {
      id: "support",
      title: t("home_support"),
      links: [
        {
          id: "issues",
          href: GITHUB_ISSUES_URL,
          label: t("home_issue_tracker"),
          external: true,
        },
        {
          id: "discussions",
          href: GITHUB_DISCUSSIONS_URL,
          label: t("home_discussions"),
          external: true,
        },
      ],
    },
    {
      id: "legal",
      title: t("home_legal"),
      links: [
        {
          id: "privacy",
          href: withLocalePrefix("/privacy", locale),
          label: t("home_privacy"),
        },
        {
          id: "terms",
          href: withLocalePrefix("/terms", locale),
          label: t("home_terms"),
        },
      ],
    },
  ];
  const socialLinks: SocialLink[] = [
    { name: "GitHub", href: GITHUB_URL, icon: Github },
    {
      name: "Twitter",
      href: `https://twitter.com/${TWITTERACCOUNT.replace("@", "")}`,
      icon: Twitter,
    },
    { name: "Email", href: `mailto:${CONTACT_EMAIL}`, icon: Mail },
  ];

  return (
    <footer className="border-border bg-background border-t">
      <ShellContainer>
        <div className="py-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <Logo className="text-primary h-6 w-6" variant="icon-only" />
                <span className="text-foreground text-xl font-bold">
                  {APP_NAME}
                </span>
              </div>
              <p className="text-muted-foreground mb-6 max-w-md text-sm">
                {t("home_practical_saas_starter_teams_want")}
              </p>
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      className="border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary flex h-9 w-9 items-center justify-center border transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
                <div className="bg-border mx-1 h-6 w-px" />
                <ModeToggle variant="outline" size="icon" />
                <LocaleSwitcher
                  variant="outline"
                  size="sm"
                  showLabel
                  align="start"
                />
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-5">
                {sections.map((section) => (
                  <div key={section.id}>
                    <h3 className="text-foreground mb-4 text-sm font-semibold">
                      {section.title}
                    </h3>
                    <ul className="space-y-3">
                      {section.links.map((link) => (
                        <li key={link.id}>
                          <FooterLinkItem link={link} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Separator />
        <div className="flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <span className="text-muted-foreground text-sm">
            {t("home_all_rights_reserved", { currentYear, COMPANY_NAME })}
          </span>
          <span className="text-muted-foreground flex items-center gap-2 text-sm">
            <Heart className="h-4 w-4 text-red-500" />
            {t("home_ullrai_developers")}
          </span>
        </div>
      </ShellContainer>
    </footer>
  );
}
