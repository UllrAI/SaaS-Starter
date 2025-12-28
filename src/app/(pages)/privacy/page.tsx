import React from "react";

import { createMetadata } from "@/lib/metadata";
import { COMPANY_NAME, PRIVACY_EMAIL } from "@/lib/config/constants";

import env from "@/env";

export const metadata = createMetadata({
  title: "Privacy Policy",
  description: `Learn how ${COMPANY_NAME} collects, uses, and protects your personal information.`,
  alternates: {
    canonical: `${env.NEXT_PUBLIC_APP_URL}/privacy`,
  },
});

const privacySections = [
  {
    id: "information-collection",
    title: "Information We Collect",

    content: [
      "Account information (name, email, password)",
      "Usage data and analytics",
      "Device and browser information",
      "Payment information (processed securely by our payment providers)",
      "Communications with our support team",
    ],
  },
  {
    id: "information-use",
    title: "How We Use Your Information",

    content: [
      "Provide and maintain our services",
      "Process transactions and send related information",
      "Send technical notices and support messages",
      "Improve our services and develop new features",
      "Comply with legal obligations",
    ],
  },
  {
    id: "information-sharing",
    title: "Information Sharing",

    content: [
      "We do not sell your personal information",
      "Service providers who assist in our operations",
      "Legal compliance when required by law",
      "Business transfers (mergers, acquisitions)",
      "With your explicit consent",
    ],
  },
  {
    id: "data-security",
    title: "Data Security",
    // icon: Shield, // Removed icon
    content: [
      "Industry-standard encryption for data in transit and at rest",
      "Regular security audits and assessments",
      "Access controls and authentication measures",
      "Secure data centers with physical security",
      "Employee training on data protection",
    ],
  },
  {
    id: "your-rights",
    title: "Your Rights",
    // icon: Eye, // Removed icon
    content: [
      "Access your personal information",
      "Correct inaccurate information",
      "Delete your account and data",
      "Export your data",
      "Opt-out of marketing communications",
    ],
  },
  {
    id: "data-retention",
    title: "Data Retention",
    // icon: Lock, // Removed icon
    content: [
      "Account data: Retained while your account is active",
      "Usage data: Retained for up to 2 years for analytics",
      "Support communications: Retained for 3 years",
      "Legal compliance: As required by applicable laws",
      "Deleted data: Permanently removed within 30 days",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="py-16">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-foreground mb-12 text-center text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Privacy <span className="text-primary">Policy</span>
          </h1>

          <p className="text-muted-foreground mb-10 text-center text-xl leading-relaxed">
            We are committed to protecting your privacy and ensuring the
            security of your personal information. This policy explains how we
            collect, use, and safeguard your data.
          </p>

          <div className="text-muted-foreground mb-12 text-center text-sm">
            <p>Last updated: December 2024</p>
            <p>Effective: December 1, 2024</p>
          </div>

          <div className="space-y-8">
            {privacySections.map((section) => (
              <div key={section.id} id={section.id}>
                <h2 className="mb-4 text-2xl font-semibold">{section.title}</h2>
                <ul className="space-y-2 pl-5">
                  {section.content.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="text-muted-foreground list-disc"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
                <strong>Address:</strong> 123 Privacy Street, Data City, DC
                12345
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                <span data-lingo-skip>+1 (555) 123-4567</span>
              </p>
            </div>
          </div>

          <div className="text-muted-foreground mt-12 border-t pt-8 text-center text-sm">
            <p>
              This Privacy Policy is governed by the laws of the United States.
              We reserve the right to update this policy at any time. Material
              changes will be communicated via email or through our service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
