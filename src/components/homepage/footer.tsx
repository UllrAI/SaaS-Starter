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

interface FooterLink {
  id: string;
  name: React.ReactNode;
  href: string;
  external?: boolean;
}

interface FooterSection {
  id: string;
  title: React.ReactNode;
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
    title: <>Product</>,
    links: [
      { id: "foot-features", name: <>Features</>, href: "/#features" },
      { id: "foot-pricing", name: <>Pricing</>, href: "/pricing" },
      { id: "foot-docs", name: <>Documentation</>, href: "/docs" },
      { id: "foot-changelog", name: <>Changelog</>, href: "/changelog" },
    ],
  },
  {
    id: "foot-other-products",
    title: <>Other Products</>,
    links: [
      { id: "foot-pixmiller", name: "PixMiller", href: "https://pixmiller.com/", external: true },
      {
        id: "foot-headshots",
        name: "HeadShots.fun",
        href: "https://headshots.fun/",
        external: true,
      },
      {
        id: "foot-tomarkdown",
        name: "To Markdown",
        href: "https://to-markdown.com/",
        external: true,
      },
      { 
        id: "foot-hipng",
        name: "HiPNG.com",
        href: "https://hipng.com/",
        external: true
      },
    ],
  },
  {
    id: "foot-company",
    title: <>Company</>,
    links: [
      { id: "foot-about", name: <>About</>, href: "/about" },
      { id: "foot-blog", name: <>Blog</>, href: "/blog" },
      { id: "foot-contact", name: <>Contact</>, href: "/contact" },
      { id: "foot-careers", name: <>Careers</>, href: "/careers" },
    ],
  },
  {
    id: "foot-resources",
    title: <>Resources</>,
    links: [
      { id: "foot-help", name: <>Help Center</>, href: "/help" },
      { id: "foot-community", name: <>Community</>, href: "/community" },
      { id: "foot-tutorials", name: <>Tutorials</>, href: "/tutorials" },
      { id: "foot-templates", name: <>Templates</>, href: "/templates" },
    ],
  },
  {
    id: "foot-legal",
    title: <>Legal</>,
    links: [
      { id: "foot-privacy", name: <>Privacy</>, href: "/privacy" },
      { id: "foot-terms", name: <>Terms</>, href: "/terms" },
      { id: "foot-security", name: <>Security</>, href: "/security" },
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

  if (link.external) {
    return (
      <a
        href={link.href}
        className={linkClasses}
        target="_blank"
        rel="noopener noreferrer"
      >
        {link.name}
      </a>
    );
  }

  return (
    <Link href={link.href} className={linkClasses}>
      {link.name}
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
                Complete UllrAI Micro SaaS starter with authentication, payments,
                database, and deployment.
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
                      {section.title}
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
