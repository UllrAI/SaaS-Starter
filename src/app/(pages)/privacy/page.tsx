import Link from "next/link";

import {
  COMPANY_NAME,
  GITHUB_DISCUSSIONS_URL,
  PRIVACY_EMAIL,
} from "@/lib/config/constants";
import { Shield } from "lucide-react";
import { createMetadata } from "@/lib/metadata";
import { createLocalizedAlternates } from "@/lib/metadata";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { ReadingContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import {
  PageIntro,
  PageIntroDescription,
  PageIntroHeading,
} from "@/components/layout/page-intro";

export async function generateMetadata() {
  const locale = await getRequestLocale();
  const metadata = createMetadata({
    alternates: createLocalizedAlternates("/privacy", locale),
  });

  return {
    ...metadata,
    title: "Privacy Policy",
    description: `Learn how ${COMPANY_NAME} collects, uses, and protects your personal information.`,
    openGraph: {
      ...metadata.openGraph,
      title: "Privacy Policy",
      description: `Learn how ${COMPANY_NAME} collects, uses, and protects your personal information.`,
    },
    twitter: {
      ...metadata.twitter,
      title: "Privacy Policy",
      description: `Learn how ${COMPANY_NAME} collects, uses, and protects your personal information.`,
    },
  };
}

export default function PrivacyPage() {
  const privacySections = [
    {
      id: "information-collection",
      title: <>Information We Collect</>,
      items: [
        <>Account information (name, email, password)</>,
        <>Usage data and analytics</>,
        <>Device and browser information</>,
        <>Payment information (processed securely by our payment providers)</>,
        <>Communications with our support team</>,
      ],
    },
    {
      id: "information-use",
      title: <>How We Use Your Information</>,
      items: [
        <>Provide and maintain our services</>,
        <>Process transactions and send related information</>,
        <>Send technical notices and support messages</>,
        <>Improve our services and develop new features</>,
        <>Comply with legal obligations</>,
      ],
    },
    {
      id: "information-sharing",
      title: <>Information Sharing</>,
      items: [
        <>We do not sell your personal information</>,
        <>Service providers who assist in our operations</>,
        <>Legal compliance when required by law</>,
        <>Business transfers (mergers, acquisitions)</>,
        <>With your explicit consent</>,
      ],
    },
    {
      id: "data-security",
      title: <>Data Security</>,
      items: [
        <>Industry-standard encryption for data in transit and at rest</>,
        <>Regular security audits and assessments</>,
        <>Access controls and authentication measures</>,
        <>Secure data centers with physical security</>,
        <>Employee training on data protection</>,
      ],
    },
    {
      id: "your-rights",
      title: <>Your Rights</>,
      items: [
        <>Access your personal information</>,
        <>Correct inaccurate information</>,
        <>Delete your account and data</>,
        <>Export your data</>,
        <>Opt-out of marketing communications</>,
      ],
    },
    {
      id: "data-retention",
      title: <>Data Retention</>,
      items: [
        <>Account data: Retained while your account is active</>,
        <>Usage data: Retained for up to 2 years for analytics</>,
        <>Support communications: Retained for 3 years</>,
        <>Legal compliance: As required by applicable laws</>,
        <>Deleted data: Permanently removed within 30 days</>,
      ],
    },
  ];

  return (
    <div className="py-16">
      <ReadingContainer>
        <PageIntro
          className="mb-12"
          badge={
            <Badge className="border-border bg-background/50 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
              <Shield className="text-muted-foreground mr-2 h-3 w-3" />
              <span className="text-muted-foreground font-mono">
                PRIVACY.md
              </span>
            </Badge>
          }
        >
          <PageIntroHeading>Privacy Policy</PageIntroHeading>
          <PageIntroDescription className="mb-10">
            We are committed to protecting your privacy and ensuring the
            security of your personal information. This policy explains how we
            collect, use, and safeguard your data.
          </PageIntroDescription>
          <div className="text-muted-foreground text-sm">
            <p>Last updated: December 2024</p>
            <p>Effective: December 1, 2024</p>
          </div>
        </PageIntro>

        <div className="space-y-8">
          {privacySections.map((section) => {
            return (
              <div key={section.id} id={section.id}>
                <h2 className="mb-4 text-2xl font-semibold">{section.title}</h2>
                <ul className="space-y-2 pl-5">
                  {section.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="text-muted-foreground list-disc"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-12">
          <h2 className="mb-4 text-2xl font-semibold">
            Questions About This Policy?
          </h2>
          <p className="text-muted-foreground mb-4">
            If you have any questions about this Privacy Policy or our data
            practices, please don&apos;t hesitate to contact us.
          </p>
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              <strong>Email:</strong> {PRIVACY_EMAIL}
            </p>
            <p>
              <strong>Support:</strong>{" "}
              <Link href="/contact" className="underline underline-offset-4">
                Contact page
              </Link>
            </p>
            <p>
              <strong>Community:</strong>{" "}
              <a
                href={GITHUB_DISCUSSIONS_URL}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                GitHub Discussions
              </a>
            </p>
          </div>
        </div>

        <div className="text-muted-foreground mt-12 border-t pt-8 text-center text-sm">
          <p>
            This Privacy Policy is governed by the laws of the United States. We
            reserve the right to update this policy at any time. Material
            changes will be communicated via email or through our service.
          </p>
        </div>
      </ReadingContainer>
    </div>
  );
}
