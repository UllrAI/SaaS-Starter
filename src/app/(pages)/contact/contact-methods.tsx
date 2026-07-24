import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Bug, Mail, MessageSquare } from "lucide-react";
import {
  CONTACT_EMAIL,
  DOCS_URL,
  GITHUB_DISCUSSIONS_URL,
  GITHUB_ISSUES_URL,
} from "@/lib/config/constants";
export function ContactMethods({
  locale = SOURCE_LOCALE,
}: {
  locale?: SupportedLocale;
} = {}) {
  const { t } = getStaticTranslations(locale);
  const contactMethods = [
    {
      icon: Mail,
      title: <>{t("97cf6b64f238", "Email Support")}</>,
      description: <>{t("27f27aad58ab", "Technical support via email")}</>,
      action: CONTACT_EMAIL,
      href: `mailto:${CONTACT_EMAIL}`,
      label: <>{t("contactEmailGateway", "Email gateway")}</>,
      actionSkip: true,
    },
    {
      icon: MessageSquare,
      title: <>{t("4cbfb21b1f5e", "Community Discussions")}</>,
      description: (
        <>
          {t("202cdce01ea9", "Ask product and integration questions in public")}
        </>
      ),
      action: <>{t("contactOpenDiscussions", "Open discussions")}</>,
      href: GITHUB_DISCUSSIONS_URL,
      label: <>{t("contactDiscussionBoard", "Discussion board")}</>,
      external: true,
    },
    {
      icon: Bug,
      title: <>{t("77fffae104d0", "Bug Reports")}</>,
      description: (
        <>
          {t(
            "862aa9e582a9",
            "Report reproducible bugs and integration failures",
          )}
        </>
      ),
      action: <>{t("contactOpenIssues", "Open issues")}</>,
      href: GITHUB_ISSUES_URL,
      label: <>{t("contactIssueTracker", "Issue tracker")}</>,
      external: true,
    },
    {
      icon: BookOpen,
      title: <>{t("3699b19f764e", "Documentation")}</>,
      description: (
        <>
          {t(
            "eeaabc2cfd8d",
            "Setup guides, billing flow notes, and deployment docs",
          )}
        </>
      ),
      action: <>{t("contactReadDocs", "Read docs")}</>,
      href: DOCS_URL,
      label: <>{t("contactDocsPortal", "Documentation portal")}</>,
      external: true,
    },
  ];
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {contactMethods.map((method) => {
        const Icon = method.icon;
        return (
          <Card
            key={method.href}
            className="group shadow-sm transition-all hover:shadow-md"
          >
            <CardHeader>
              <div className="bg-primary/10 text-primary border-primary/20 mb-4 flex h-12 w-12 items-center justify-center border transition-transform group-hover:scale-110">
                <Icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">{method.title}</CardTitle>
              <p className="text-muted-foreground font-mono text-[10px] uppercase">
                {method.label}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                {method.description}
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
                  translate={method.actionSkip ? "no" : undefined}
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
