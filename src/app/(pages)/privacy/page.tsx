import React from "react";

import { COMPANY_NAME, PRIVACY_EMAIL } from "@/lib/config/constants";
import { createLocalizedMetadata } from "@/lib/i18n/page-metadata";

import env from "@/env";

export async function generateMetadata() {
  return createLocalizedMetadata({
    en: {
      title: "Privacy Policy",
      description: `Learn how ${COMPANY_NAME} collects, uses, and protects your personal information.`,
      alternates: {
        canonical: `${env.NEXT_PUBLIC_APP_URL}/privacy`,
      },
    },
    "zh-Hans": {
      title: "隐私政策",
      description: `了解 ${COMPANY_NAME} 如何收集、使用和保护您的个人信息。`,
      alternates: {
        canonical: `${env.NEXT_PUBLIC_APP_URL}/privacy`,
      },
    },
  });
}

const privacySections = [
  {
    id: "information-collection",
    Title: function PrivacySectionTitleInformationCollection() {
      return <>Information We Collect</>;
    },
    Items: [
      function PrivacySectionItemAccountInformation() {
        return <>Account information (name, email, password)</>;
      },
      function PrivacySectionItemUsageData() {
        return <>Usage data and analytics</>;
      },
      function PrivacySectionItemDeviceInformation() {
        return <>Device and browser information</>;
      },
      function PrivacySectionItemPaymentInformation() {
        return <>Payment information (processed securely by our payment providers)</>;
      },
      function PrivacySectionItemSupportCommunications() {
        return <>Communications with our support team</>;
      },
    ],
  },
  {
    id: "information-use",
    Title: function PrivacySectionTitleInformationUse() {
      return <>How We Use Your Information</>;
    },
    Items: [
      function PrivacySectionItemProvideServices() {
        return <>Provide and maintain our services</>;
      },
      function PrivacySectionItemProcessTransactions() {
        return <>Process transactions and send related information</>;
      },
      function PrivacySectionItemSupportMessages() {
        return <>Send technical notices and support messages</>;
      },
      function PrivacySectionItemImproveServices() {
        return <>Improve our services and develop new features</>;
      },
      function PrivacySectionItemLegalObligations() {
        return <>Comply with legal obligations</>;
      },
    ],
  },
  {
    id: "information-sharing",
    Title: function PrivacySectionTitleInformationSharing() {
      return <>Information Sharing</>;
    },
    Items: [
      function PrivacySectionItemNoSale() {
        return <>We do not sell your personal information</>;
      },
      function PrivacySectionItemServiceProviders() {
        return <>Service providers who assist in our operations</>;
      },
      function PrivacySectionItemLegalCompliance() {
        return <>Legal compliance when required by law</>;
      },
      function PrivacySectionItemBusinessTransfers() {
        return <>Business transfers (mergers, acquisitions)</>;
      },
      function PrivacySectionItemConsent() {
        return <>With your explicit consent</>;
      },
    ],
  },
  {
    id: "data-security",
    Title: function PrivacySectionTitleDataSecurity() {
      return <>Data Security</>;
    },
    Items: [
      function PrivacySectionItemEncryption() {
        return <>Industry-standard encryption for data in transit and at rest</>;
      },
      function PrivacySectionItemAudits() {
        return <>Regular security audits and assessments</>;
      },
      function PrivacySectionItemAccessControls() {
        return <>Access controls and authentication measures</>;
      },
      function PrivacySectionItemSecureDataCenters() {
        return <>Secure data centers with physical security</>;
      },
      function PrivacySectionItemTraining() {
        return <>Employee training on data protection</>;
      },
    ],
  },
  {
    id: "your-rights",
    Title: function PrivacySectionTitleYourRights() {
      return <>Your Rights</>;
    },
    Items: [
      function PrivacySectionItemAccess() {
        return <>Access your personal information</>;
      },
      function PrivacySectionItemCorrect() {
        return <>Correct inaccurate information</>;
      },
      function PrivacySectionItemDelete() {
        return <>Delete your account and data</>;
      },
      function PrivacySectionItemExport() {
        return <>Export your data</>;
      },
      function PrivacySectionItemOptOut() {
        return <>Opt-out of marketing communications</>;
      },
    ],
  },
  {
    id: "data-retention",
    Title: function PrivacySectionTitleDataRetention() {
      return <>Data Retention</>;
    },
    Items: [
      function PrivacySectionItemAccountRetention() {
        return <>Account data: Retained while your account is active</>;
      },
      function PrivacySectionItemUsageRetention() {
        return <>Usage data: Retained for up to 2 years for analytics</>;
      },
      function PrivacySectionItemSupportRetention() {
        return <>Support communications: Retained for 3 years</>;
      },
      function PrivacySectionItemLegalRetention() {
        return <>Legal compliance: As required by applicable laws</>;
      },
      function PrivacySectionItemDeletedData() {
        return <>Deleted data: Permanently removed within 30 days</>;
      },
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
            {privacySections.map((section) => {
              const Title = section.Title;

              return (
              <div key={section.id} id={section.id}>
                <h2 className="mb-4 text-2xl font-semibold">
                  <Title />
                </h2>
                <ul className="space-y-2 pl-5">
                  {section.Items.map((Item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="text-muted-foreground list-disc"
                    >
                      <Item />
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
