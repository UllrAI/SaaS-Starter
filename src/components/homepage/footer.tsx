"use client";

import React from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import {
  APP_NAME,
  COMPANY_NAME,
  GITHUB_URL,
  TWITTERACCOUNT,
  CONTACT_EMAIL,
} from "@/lib/config/constants";
import { Github, Twitter, Mail, Heart } from "lucide-react";

const FooterSectionTitleProduct = () => <>Product</>;
const FooterSectionTitleOtherProducts = () => <>Other Products</>;
const FooterSectionTitleCompany = () => <>Company</>;
const FooterSectionTitleResources = () => <>Resources</>;
const FooterSectionTitleLegal = () => <>Legal</>;

const FooterLabelFeatures = () => <>Features</>;
const FooterLabelPricing = () => <>Pricing</>;
const FooterLabelDocumentation = () => <>Documentation</>;
const FooterLabelChangelog = () => <>Changelog</>;
const FooterLabelAbout = () => <>About</>;
const FooterLabelBlog = () => <>Blog</>;
const FooterLabelContact = () => <>Contact</>;
const FooterLabelCareers = () => <>Careers</>;
const FooterLabelHelpCenter = () => <>Help Center</>;
const FooterLabelCommunity = () => <>Community</>;
const FooterLabelTutorials = () => <>Tutorials</>;
const FooterLabelTemplates = () => <>Templates</>;
const FooterLabelPrivacy = () => <>Privacy</>;
const FooterLabelTerms = () => <>Terms</>;
const FooterLabelSecurity = () => <>Security</>;

type FooterLink = {
  id: string;
  href: string;
  external?: boolean;
} & (
  | { kind: "i18n"; Label: React.ComponentType }
  | { kind: "text"; labelText: string }
);

interface FooterSection {
  id: string;
  Title: React.ComponentType;
  links: FooterLink[];
}

interface FooterSocialLink {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const footerSections: FooterSection[] = [
  {
    id: "foot-product",
    Title: FooterSectionTitleProduct,
    links: [
      {
        id: "foot-features",
        kind: "i18n",
        Label: FooterLabelFeatures,
        href: "/#features",
      },
      {
        id: "foot-pricing",
        kind: "i18n",
        Label: FooterLabelPricing,
        href: "/pricing",
      },
      {
        id: "foot-docs",
        kind: "i18n",
        Label: FooterLabelDocumentation,
        href: "/docs",
      },
      {
        id: "foot-changelog",
        kind: "i18n",
        Label: FooterLabelChangelog,
        href: "/changelog",
      },
    ],
  },
  {
    id: "foot-other-products",
    Title: FooterSectionTitleOtherProducts,
    links: [
      {
        id: "foot-pixmiller",
        kind: "text",
        labelText: "PixMiller",
        href: "https://pixmiller.com/",
        external: true,
      },
      {
        id: "foot-headshots",
        kind: "text",
        labelText: "HeadShots.fun",
        href: "https://headshots.fun/",
        external: true,
      },
      {
        id: "foot-tomarkdown",
        kind: "text",
        labelText: "To Markdown",
        href: "https://to-markdown.com/",
        external: true,
      },
      {
        id: "foot-hipng",
        kind: "text",
        labelText: "HiPNG.com",
        href: "https://hipng.com/",
        external: true,
      },
    ],
  },
  {
    id: "foot-company",
    Title: FooterSectionTitleCompany,
    links: [
      { id: "foot-about", kind: "i18n", Label: FooterLabelAbout, href: "/about" },
      { id: "foot-blog", kind: "i18n", Label: FooterLabelBlog, href: "/blog" },
      {
        id: "foot-contact",
        kind: "i18n",
        Label: FooterLabelContact,
        href: "/contact",
      },
      {
        id: "foot-careers",
        kind: "i18n",
        Label: FooterLabelCareers,
        href: "/careers",
      },
    ],
  },
  {
    id: "foot-resources",
    Title: FooterSectionTitleResources,
    links: [
      {
        id: "foot-help",
        kind: "i18n",
        Label: FooterLabelHelpCenter,
        href: "/help",
      },
      {
        id: "foot-community",
        kind: "i18n",
        Label: FooterLabelCommunity,
        href: "/community",
      },
      {
        id: "foot-tutorials",
        kind: "i18n",
        Label: FooterLabelTutorials,
        href: "/tutorials",
      },
      {
        id: "foot-templates",
        kind: "i18n",
        Label: FooterLabelTemplates,
        href: "/templates",
      },
    ],
  },
  {
    id: "foot-legal",
    Title: FooterSectionTitleLegal,
    links: [
      {
        id: "foot-privacy",
        kind: "i18n",
        Label: FooterLabelPrivacy,
        href: "/privacy",
      },
      { id: "foot-terms", kind: "i18n", Label: FooterLabelTerms, href: "/terms" },
      {
        id: "foot-security",
        kind: "i18n",
        Label: FooterLabelSecurity,
        href: "/security",
      },
    ],
  },
];

const socialLinks: FooterSocialLink[] = [
  {
    name: "GitHub",
    href: GITHUB_URL,
    icon: Github,
  },
  {
    name: "Twitter",
    href: `https://twitter.com/${TWITTERACCOUNT.replace("@", "")}`,
    icon: Twitter,
  },
  {
    name: "Email",
    href: `mailto:${CONTACT_EMAIL}`,
    icon: Mail,
  },
];

function FooterLinkComponent({ link }: { link: FooterLink }) {
  const linkClasses =
    "text-sm text-muted-foreground transition-colors hover:text-foreground";
  const label =
    link.kind === "i18n"
      ? React.createElement(link.Label)
      : link.labelText;

  if (link.external) {
    return (
      <a
        href={link.href}
        className={linkClasses}
        target="_blank"
        rel="noopener noreferrer"
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={link.href} className={linkClasses}>
      {label}
    </Link>
  );
}

function FooterSocialLinkComponent({ social }: { social: FooterSocialLink }) {
  const IconComponent = social.icon;

  return (
    <a
      href={social.href}
      className="border-border bg-background text-muted-foreground hover:text-foreground hover:border-border/80 flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={social.name}
    >
      <IconComponent className="h-4 w-4" />
    </a>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-border bg-background border-t">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-6">
            {/* Brand section */}
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <Logo className="text-primary h-6 w-6" variant="icon-only" />
                <span className="text-foreground text-xl font-bold">
                  {APP_NAME}
                </span>
              </div>

              <p className="text-muted-foreground mb-6 max-w-md text-sm">
                Complete UllrAI Micro SaaS starter with authentication,
                payments, database, and deployment.
              </p>

              {/* Social links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <FooterSocialLinkComponent
                    key={social.name}
                    social={social}
                  />
                ))}
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

            {/* Links sections */}
            <div className="lg:col-span-4">
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-5">
                {footerSections.map((section) => (
                  <div key={section.id}>
                    <h3 className="text-foreground mb-4 text-sm font-semibold">
                      <section.Title />
                    </h3>
                    <ul className="space-y-3">
                      {section.links.map((link) => (
                        <li key={link.id}>
                          <FooterLinkComponent link={link} />
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

        {/* Bottom section */}
        <div className="py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <span>
                © {currentYear} {COMPANY_NAME}. All rights reserved.
              </span>
            </div>

            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Heart className="h-4 w-4 text-red-500" />
              <span>by UllrAI, for developers</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
