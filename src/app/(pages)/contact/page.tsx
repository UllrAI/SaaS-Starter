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
import Link from "next/link";
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
import { createLocalizedAlternates, createMetadata } from "@/lib/metadata";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { ContactMethods } from "./contact-methods";

export async function generateMetadata() {
  const locale = await getRequestLocale();
  const metadata = createMetadata({
    alternates: createLocalizedAlternates("/contact", locale),
  });

  return {
    ...metadata,
    title: "Contact Us",
    description: `Get in touch with our team. We are here to help with any questions about ${COMPANY_NAME}.`,
    openGraph: {
      ...metadata.openGraph,
      title: "Contact Us",
      description: `Get in touch with our team. We are here to help with any questions about ${COMPANY_NAME}.`,
    },
    twitter: {
      ...metadata.twitter,
      title: "Contact Us",
      description: `Get in touch with our team. We are here to help with any questions about ${COMPANY_NAME}.`,
    },
  };
}

export default function ContactPage() {
  return (
    <>
      <MarketingPageShell>
        <PageIntro
          className="mb-20"
          badge={
            <Badge className="border-border bg-background/50 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
              <Mail className="text-muted-foreground mr-2 h-3 w-3" />
              <span className="text-muted-foreground font-mono">
                CONTACT.md
              </span>
            </Badge>
          }
        >
          <PageIntroHeading>Get in Touch</PageIntroHeading>
          <PageIntroDescription>
            Have questions? Need support? Want to collaborate? We&apos;re here
            to help. Choose your preferred channel below.
          </PageIntroDescription>
        </PageIntro>

        <div className="mb-24">
          <PageSectionHeading icon={<Send className="text-primary h-6 w-6" />}>
            Contact Channels
          </PageSectionHeading>

          <ContactMethods />
        </div>

        <div className="mb-24">
          <PageSectionHeading icon={<Clock className="text-primary h-6 w-6" />}>
            Support Hours
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Standard Support</CardTitle>
                <CardDescription>
                  Available for all users and customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-sm">
                    Monday - Friday
                  </span>
                  <span className="font-mono text-sm" data-lingo-skip>
                    9:00 - 18:00
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-sm">
                    Saturday
                  </span>
                  <span className="font-mono text-sm" data-lingo-skip>
                    10:00 - 16:00
                  </span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-muted-foreground text-sm">Sunday</span>
                  <span className="font-mono text-sm">Closed</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Premium Support</CardTitle>
                <CardDescription>
                  Enterprise customers with SLA guarantees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-sm">
                    Availability
                  </span>
                  <span className="font-mono text-sm" data-lingo-skip>
                    24/7/365
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-sm">
                    Response Time
                  </span>
                  <span className="font-mono text-sm">Under 1 hour</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-muted-foreground text-sm">
                    Priority
                  </span>
                  <span className="font-mono text-sm">Critical Priority</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-24">
          <PageSectionHeading
            icon={<HelpCircle className="text-primary h-6 w-6" />}
          >
            Quick Answers
          </PageSectionHeading>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  What is the average response time?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We typically respond to all inquiries within 24 hours during
                  business days. Premium customers receive responses in under 1
                  hour.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Do you offer enterprise support?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Yes. Enterprise support is handled through dedicated email
                  workflows and structured issue triage so requests stay
                  traceable from report to resolution.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Can I schedule a demo?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Yes. Send your use case to {CONTACT_EMAIL} and include the
                  product area you want to review so we can route it correctly.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Where can I find documentation?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                  Our comprehensive documentation covers all features, APIs, and
                  integrations.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={DOCS_URL}
                    className="inline-flex items-center gap-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="text-xs">View Docs</span>
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
            Helpful Resources
          </PageSectionHeading>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Documentation</CardTitle>
                <CardDescription className="text-xs">
                  Complete guides and API references
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <a href={DOCS_URL} target="_blank" rel="noreferrer">
                    Open Docs
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Community Forum</CardTitle>
                <CardDescription className="text-xs">
                  Connect with other developers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={GITHUB_DISCUSSIONS_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Join Discussions
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Release Notes</CardTitle>
                <CardDescription className="text-xs">
                  Track shipping history and starter changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={GITHUB_RELEASES_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Releases
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
              Ready to Get Started?
            </PageIntroHeading>
            <PageIntroDescription className="mb-8 text-lg">
              Join thousands of developers building amazing products with{" "}
              {COMPANY_NAME}.
            </PageIntroDescription>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/pricing">View Pricing</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </PageIntro>
        </SectionContainer>
      </section>
    </>
  );
}
