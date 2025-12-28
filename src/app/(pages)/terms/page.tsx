import React from "react";

import { createMetadata } from "@/lib/metadata";
import { COMPANY_NAME, LEGAL_EMAIL } from "@/lib/config/constants";

export const metadata = createMetadata({
  title: "Terms of Service",
  description: `Read our terms of service to understand your rights and responsibilities when using ${COMPANY_NAME}.`,
});

const termsSections = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",

    content: [
      `By accessing or using ${COMPANY_NAME}, you agree to be bound by these Terms of Service`,
      "If you disagree with any part of these terms, you may not access the service",
      "These terms apply to all visitors, users, and others who access the service",
      "We may update these terms from time to time without prior notice",
    ],
  },
  {
    id: "user-accounts",
    title: "User Accounts",

    content: [
      "You must provide accurate and complete information when creating an account",
      "You are responsible for maintaining the security of your account",
      "You must notify us immediately of any unauthorized use of your account",
      "One person or legal entity may not maintain more than one free account",
      "Accounts registered by bots or automated methods are not permitted",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",

    content: [
      "Use the service only for lawful purposes and in accordance with these terms",
      "Do not use the service to transmit harmful, offensive, or illegal content",
      "Do not attempt to gain unauthorized access to our systems or networks",
      "Do not interfere with or disrupt the service or servers",
      "Do not use the service to compete with or replicate our business model",
    ],
  },
  {
    id: "payment-terms",
    title: "Payment and Billing",

    content: [
      "Paid plans are billed in advance on a monthly or annual basis",
      "All fees are non-refundable except as required by law",
      "You authorize us to charge your payment method for all fees",
      "Price changes will be communicated with 30 days notice",
      "Failure to pay may result in service suspension or termination",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",

    content: [
      "The service and its content are protected by copyright and other laws",
      "You retain ownership of content you create using our service",
      "You grant us a license to use your content to provide the service",
      "You may not copy, modify, or distribute our proprietary content",
      "Respect the intellectual property rights of others",
    ],
  },
  {
    id: "service-availability",
    title: "Service Availability",

    content: [
      "We strive to maintain high service availability but cannot guarantee 100% uptime",
      "Scheduled maintenance will be announced in advance when possible",
      "We may modify or discontinue features with reasonable notice",
      "Emergency maintenance may occur without prior notice",
      "Service level agreements are specified in your subscription plan",
    ],
  },
  {
    id: "termination",
    title: "Termination",

    content: [
      "You may terminate your account at any time through your account settings",
      "We may terminate accounts that violate these terms",
      "Upon termination, your right to use the service ceases immediately",
      "We will provide reasonable notice before terminating paid accounts",
      "Data export options are available before account termination",
    ],
  },
  {
    id: "disclaimers",
    title: "Disclaimers and Limitations",

    content: [
      "The service is provided 'as is' without warranties of any kind",
      "We disclaim all warranties, express or implied, including merchantability",
      "We are not liable for indirect, incidental, or consequential damages",
      "Our total liability is limited to the amount you paid in the last 12 months",
      "Some jurisdictions do not allow these limitations",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="py-16">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-foreground mb-12 text-center text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Terms of <span className="text-primary">Service</span>
          </h1>

          <p className="text-muted-foreground mb-10 text-center text-xl leading-relaxed">
            These terms govern your use of {COMPANY_NAME} and outline the rights
            and responsibilities of both you and us. Please read them carefully.
          </p>

          <div className="text-muted-foreground mb-12 text-center text-sm">
            <p>Last updated: December 2024</p>
            <p>Effective: December 1, 2024</p>
          </div>

          <div className="space-y-8">
            {termsSections.map((section) => (
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
              Questions About These Terms?
            </h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about these Terms of Service, please
              contact our legal team.
            </p>
            <div className="text-muted-foreground space-y-2 text-sm">
              <p>
                <strong>Email:</strong> {LEGAL_EMAIL}
              </p>
              <p>
                <strong>Address:</strong> 123 Legal Street, Terms City, TC 12345
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                <span data-lingo-skip>+1 (555) 123-4567</span>
              </p>
            </div>
          </div>

          <div className="text-muted-foreground mt-12 border-t pt-8 text-center text-sm">
            <p>
              These Terms of Service are governed by the laws of the United
              States. Any disputes will be resolved in the courts of [Your
              Jurisdiction]. If any provision is found unenforceable, the
              remaining provisions will remain in effect.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
