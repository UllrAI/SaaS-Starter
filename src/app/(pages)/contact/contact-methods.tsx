import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Bug, Mail, MessageSquare } from "lucide-react";
import {
  CONTACT_EMAIL,
  DOCS_URL,
  GITHUB_DISCUSSIONS_URL,
  GITHUB_ISSUES_URL,
} from "@/lib/config/constants";

const contactMethods = [
  {
    icon: Mail,
    Title: function ContactMethodTitleEmail() {
      return <>Email Support</>;
    },
    Description: function ContactMethodDescriptionEmail() {
      return <>Technical support via email</>;
    },
    action: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
    label: "EMAIL_GATEWAY",
    actionSkip: true,
  },
  {
    icon: MessageSquare,
    Title: function ContactMethodTitleChat() {
      return <>Community Discussions</>;
    },
    Description: function ContactMethodDescriptionChat() {
      return <>Ask product and integration questions in public</>;
    },
    action: "Open Discussions",
    href: GITHUB_DISCUSSIONS_URL,
    label: "DISCUSSION_BOARD",
    external: true,
  },
  {
    icon: Bug,
    Title: function ContactMethodTitleIssues() {
      return <>Bug Reports</>;
    },
    Description: function ContactMethodDescriptionIssues() {
      return <>Report reproducible bugs and integration failures</>;
    },
    action: "Open Issues",
    href: GITHUB_ISSUES_URL,
    label: "ISSUE_TRACKER",
    external: true,
  },
  {
    icon: BookOpen,
    Title: function ContactMethodTitleDocs() {
      return <>Documentation</>;
    },
    Description: function ContactMethodDescriptionDocs() {
      return <>Setup guides, billing flow notes, and deployment docs</>;
    },
    action: "Read Docs",
    href: DOCS_URL,
    label: "DOCS_PORTAL",
    external: true,
  },
];

export function ContactMethods() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {contactMethods.map((method) => {
        const Icon = method.icon;
        const Title = method.Title;
        const Description = method.Description;
        return (
          <Card
            key={method.label}
            className="group shadow-sm transition-all hover:shadow-md"
          >
            <CardHeader>
              <div className="bg-primary/10 text-primary border-primary/20 mb-4 flex h-12 w-12 items-center justify-center border transition-transform group-hover:scale-110">
                <Icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">
                <Title />
              </CardTitle>
              <p className="text-muted-foreground font-mono text-[10px] uppercase">
                {method.label}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                <Description />
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full shadow-xs"
                asChild
              >
                <a
                  href={method.href}
                  className="block font-mono text-xs"
                  data-lingo-skip={method.actionSkip ? true : undefined}
                  target={method.external ? "_blank" : undefined}
                  rel={method.external ? "noreferrer" : undefined}
                >
                  {method.action}
                </a>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
