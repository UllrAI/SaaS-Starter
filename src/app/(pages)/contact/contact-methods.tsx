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
      title: <>{t("contact_email_support")}</>,
      description: <>{t("contact_technical_support_via_email")}</>,
      action: CONTACT_EMAIL,
      href: `mailto:${CONTACT_EMAIL}`,
      label: <>{t("contact_email_gateway")}</>,
      actionSkip: true,
    },
    {
      icon: MessageSquare,
      title: <>{t("contact_community_discussions")}</>,
      description: <>{t("contact_ask_public_questions")}</>,
      action: <>{t("contact_open_discussions")}</>,
      href: GITHUB_DISCUSSIONS_URL,
      label: <>{t("contact_discussion_board")}</>,
      external: true,
    },
    {
      icon: Bug,
      title: <>{t("contact_bug_reports")}</>,
      description: <>{t("contact_report_bugs")}</>,
      action: <>{t("contact_open_issues")}</>,
      href: GITHUB_ISSUES_URL,
      label: <>{t("contact_issue_tracker")}</>,
      external: true,
    },
    {
      icon: BookOpen,
      title: <>{t("contact_documentation")}</>,
      description: <>{t("contact_setup_guides_docs")}</>,
      action: <>{t("contact_read_docs")}</>,
      href: DOCS_URL,
      label: <>{t("contact_docs_portal")}</>,
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
            className="hover:border-primary transition-colors"
          >
            <CardHeader>
              <div className="text-primary mb-4 flex h-12 w-12 items-center">
                <Icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">{method.title}</CardTitle>
              <p className="text-muted-foreground text-xs">{method.label}</p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                {method.description}
              </p>
              <Button variant="outline" size="sm" className="w-full" asChild>
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
