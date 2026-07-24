import { useTranslation } from "@/lib/i18n/translation/client";
import { getServerTranslations } from "@/lib/i18n/translation/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Clock, HelpCircle, ExternalLink, Send, Mail } from "lucide-react";
import { LocalizedLink as Link } from "@/components/localized-link";
import { SectionContainer } from "@/components/layout/page-container";
import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import {
  PageIntro,
  PageIntroDescription,
  PageIntroHeading,
} from "@/components/layout/page-intro";
import { PageSectionHeading } from "@/components/layout/page-section-heading";
import {
  COMPANY_NAME,
  CONTACT_EMAIL,
  DOCS_URL,
  GITHUB_DISCUSSIONS_URL,
  GITHUB_RELEASES_URL,
} from "@/lib/config/constants";
import {
  createLocalizedAlternates,
  createMetadataDefaults,
} from "@/lib/metadata";
import { SOURCE_LOCALE } from "@/lib/config/i18n";
import { ContactMethods } from "./contact-methods";
export async function generateMetadata() {
  const { t } = await getServerTranslations();
  const metadata = createMetadataDefaults({
    alternates: createLocalizedAlternates("/contact", SOURCE_LOCALE),
  });
  return {
    ...metadata,
    title: t("1ca0f1f7049a", "Contact Us"),
    description: t(
      "6067860f97f1",
      "Get in touch with our team. We are here to help with any product or integration questions.",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("c88a23677841", "Contact Us"),
      description: t(
        "7e61b4df381e",
        "Get in touch with our team. We are here to help with any product or integration questions.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("aea6eac1e07d", "Contact Us"),
      description: t(
        "a30770a96b8d",
        "Get in touch with our team. We are here to help with any product or integration questions.",
      ),
    },
  };
}
export default function ContactPage() {
  const { t } = useTranslation();
  return (
    <>
      <MarketingPageShell>
        <PageIntro
          className="mb-20"
          badge={
            <Badge className="border-border bg-background/50 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
              <Mail className="text-muted-foreground mr-2 h-3 w-3" />
              <span className="text-muted-foreground font-mono">
                {t("673f84099b6d", "CONTACT.md")}
              </span>
            </Badge>
          }
        >
          <PageIntroHeading>
            {t("b828357c0eda", "Get in Touch")}
          </PageIntroHeading>
          <PageIntroDescription>
            {t(
              "170b79772e4d",
              "Have questions? Need support? Want to collaborate? We're here to help. Choose your preferred channel below.",
            )}
          </PageIntroDescription>
        </PageIntro>

        <div className="mb-24">
          <PageSectionHeading icon={<Send className="text-primary h-6 w-6" />}>
            {t("1c0a7a57a7ca", "Contact Channels")}
          </PageSectionHeading>

          <ContactMethods />
        </div>

        <div className="mb-24">
          <PageSectionHeading icon={<Clock className="text-primary h-6 w-6" />}>
            {t("eb0600bded40", "Support Hours")}
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>{t("e2d72b96e410", "Standard Support")}</CardTitle>
                <CardDescription>
                  {t("2e0e2f0b91ac", "Available for all users and customers")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("e2fc8a8fe729", "Monday - Friday")}
                  </span>
                  <span className="font-mono text-sm" translate="no">
                    9:00 - 18:00
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("f66c6362097f", "Saturday")}
                  </span>
                  <span className="font-mono text-sm" translate="no">
                    10:00 - 16:00
                  </span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("9be255da6ce5", "Sunday")}
                  </span>
                  <span className="font-mono text-sm">
                    {t("6ab2b183dfb9", "Closed")}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>{t("0c59e76ca987", "Premium Support")}</CardTitle>
                <CardDescription>
                  {t(
                    "7e35a416a6d2",
                    "Enterprise customers with SLA guarantees",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("3260515a2229", "Availability")}
                  </span>
                  <span className="font-mono text-sm" translate="no">
                    24/7/365
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("30f2a945f51b", "Response Time")}
                  </span>
                  <span className="font-mono text-sm">
                    {t("5bd5a93c0305", "Under 1 hour")}
                  </span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-muted-foreground text-sm">
                    {t("c6ddb0a604dc", "Priority")}
                  </span>
                  <span className="font-mono text-sm">
                    {t("1456e9d32e79", "Critical Priority")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-24">
          <PageSectionHeading
            icon={<HelpCircle className="text-primary h-6 w-6" />}
          >
            {t("d58c5464a5ce", "Quick Answers")}
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("b2e57fa4236b", "What is the average response time?")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(
                    "0e6d4a5299d0",
                    "We typically respond to all inquiries within 24 hours during business days. Premium customers receive responses in under 1 hour.",
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("b77121d2ce42", "Do you offer enterprise support?")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(
                    "0c6b490942ab",
                    "Yes. Enterprise support is handled through dedicated email workflows and structured issue triage so requests stay traceable from report to resolution.",
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("03225f2f6fbc", "Can I schedule a demo?")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(
                    "773e2c0904c7",
                    "Yes. Send your use case to {CONTACT_EMAIL} and include the product area you want to review so we can route it correctly.",
                    {
                      CONTACT_EMAIL,
                    },
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("df23d2a1b7b3", "Where can I find documentation?")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                  {t(
                    "b7d55d1f18eb",
                    "Our comprehensive documentation covers all features, APIs, and integrations.",
                  )}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={DOCS_URL}
                    className="inline-flex items-center gap-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="text-xs">
                      {t("74efe36eb3bc", "View Docs")}
                    </span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <PageSectionHeading
            icon={<ExternalLink className="text-primary h-6 w-6" />}
          >
            {t("b96158ba1d06", "Helpful Resources")}
          </PageSectionHeading>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("52cc03dc88c8", "Documentation")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("b31cd3cd97b0", "Complete guides and API references")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <a href={DOCS_URL} target="_blank" rel="noreferrer">
                    {t("cfe6da918ed0", "Open Docs")}
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("05cef02f4c5c", "Community Forum")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("674809a82d76", "Connect with other developers")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={GITHUB_DISCUSSIONS_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("f2e408c28059", "Join Discussions")}
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("badd051fb07b", "Release Notes")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t(
                    "a3df56389b89",
                    "Track shipping history and starter changes",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={GITHUB_RELEASES_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("1227c5b717da", "View Releases")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </MarketingPageShell>

      <section className="py-24">
        <SectionContainer>
          <PageIntro>
            <PageIntroHeading as="h2" className="mb-4 text-3xl">
              {t("48350e7c8d9a", "Ready to Get Started?")}
            </PageIntroHeading>
            <PageIntroDescription className="mb-8 text-lg">
              {t(
                "cc3b46bbd623",
                "Join thousands of developers building amazing products with {COMPANY_NAME}.",
                {
                  COMPANY_NAME,
                },
              )}
            </PageIntroDescription>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/pricing">{t("b32e51fc5358", "View Pricing")}</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/about">{t("5c315fc2d27e", "Learn More")}</Link>
              </Button>
            </div>
          </PageIntro>
        </SectionContainer>
      </section>
    </>
  );
}
