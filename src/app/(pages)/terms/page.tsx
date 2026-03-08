import React from "react";
import Link from "next/link";

import {
  COMPANY_NAME,
  GITHUB_DISCUSSIONS_URL,
  LEGAL_EMAIL,
} from "@/lib/config/constants";
import { ReadingContainer } from "@/components/layout/page-container";
import { createLocalizedAlternates, createMetadata } from "@/lib/metadata";
import { getRequestLocale } from "@/lib/i18n/server-locale";

export async function generateMetadata() {
  const locale = await getRequestLocale();
  const metadata = createMetadata({
    alternates: createLocalizedAlternates("/terms", locale),
  });

  return {
    ...metadata,
    title: "Terms of Service",
    description: `Read our terms of service to understand your rights and responsibilities when using ${COMPANY_NAME}.`,
    openGraph: {
      ...metadata.openGraph,
      title: "Terms of Service",
      description: `Read our terms of service to understand your rights and responsibilities when using ${COMPANY_NAME}.`,
    },
    twitter: {
      ...metadata.twitter,
      title: "Terms of Service",
      description: `Read our terms of service to understand your rights and responsibilities when using ${COMPANY_NAME}.`,
    },
  };
}

const termsSections = [
  {
    id: "acceptance",
    Title: function TermsSectionTitleAcceptance() {
      return <>Acceptance of Terms</>;
    },
    Items: [
      function TermsSectionItemAcceptanceBoundByTerms() {
        return (
          <>
            By accessing or using {COMPANY_NAME}, you agree to be bound by these
            Terms of Service
          </>
        );
      },
      function TermsSectionItemAcceptanceDisagree() {
        return (
          <>
            If you disagree with any part of these terms, you may not access the
            service
          </>
        );
      },
      function TermsSectionItemAcceptanceAppliesToAll() {
        return (
          <>
            These terms apply to all visitors, users, and others who access the
            service
          </>
        );
      },
      function TermsSectionItemAcceptanceUpdates() {
        return (
          <>We may update these terms from time to time without prior notice</>
        );
      },
    ],
  },
  {
    id: "user-accounts",
    Title: function TermsSectionTitleUserAccounts() {
      return <>User Accounts</>;
    },
    Items: [
      function TermsSectionItemAccountsAccurate() {
        return (
          <>
            You must provide accurate and complete information when creating an
            account
          </>
        );
      },
      function TermsSectionItemAccountsSecurity() {
        return (
          <>You are responsible for maintaining the security of your account</>
        );
      },
      function TermsSectionItemAccountsUnauthorizedUse() {
        return (
          <>
            You must notify us immediately of any unauthorized use of your
            account
          </>
        );
      },
      function TermsSectionItemAccountsOneFreeAccount() {
        return (
          <>
            One person or legal entity may not maintain more than one free
            account
          </>
        );
      },
      function TermsSectionItemAccountsBots() {
        return (
          <>
            Accounts registered by bots or automated methods are not permitted
          </>
        );
      },
    ],
  },
  {
    id: "acceptable-use",
    Title: function TermsSectionTitleAcceptableUse() {
      return <>Acceptable Use</>;
    },
    Items: [
      function TermsSectionItemUseLawful() {
        return (
          <>
            Use the service only for lawful purposes and in accordance with
            these terms
          </>
        );
      },
      function TermsSectionItemUseHarmfulContent() {
        return (
          <>
            Do not use the service to transmit harmful, offensive, or illegal
            content
          </>
        );
      },
      function TermsSectionItemUseUnauthorizedAccess() {
        return (
          <>
            Do not attempt to gain unauthorized access to our systems or
            networks
          </>
        );
      },
      function TermsSectionItemUseDisruptService() {
        return <>Do not interfere with or disrupt the service or servers</>;
      },
      function TermsSectionItemUseCompete() {
        return (
          <>
            Do not use the service to compete with or replicate our business
            model
          </>
        );
      },
    ],
  },
  {
    id: "payment-terms",
    Title: function TermsSectionTitlePaymentBilling() {
      return <>Payment and Billing</>;
    },
    Items: [
      function TermsSectionItemPaymentAdvance() {
        return (
          <>Paid plans are billed in advance on a monthly or annual basis</>
        );
      },
      function TermsSectionItemPaymentNonRefundable() {
        return <>All fees are non-refundable except as required by law</>;
      },
      function TermsSectionItemPaymentChargeAuthorization() {
        return <>You authorize us to charge your payment method for all fees</>;
      },
      function TermsSectionItemPaymentPriceChanges() {
        return <>Price changes will be communicated with 30 days notice</>;
      },
      function TermsSectionItemPaymentSuspension() {
        return (
          <>Failure to pay may result in service suspension or termination</>
        );
      },
    ],
  },
  {
    id: "intellectual-property",
    Title: function TermsSectionTitleIntellectualProperty() {
      return <>Intellectual Property</>;
    },
    Items: [
      function TermsSectionItemIpProtected() {
        return (
          <>
            The service and its content are protected by copyright and other
            laws
          </>
        );
      },
      function TermsSectionItemIpOwnership() {
        return (
          <>You retain ownership of content you create using our service</>
        );
      },
      function TermsSectionItemIpLicense() {
        return (
          <>You grant us a license to use your content to provide the service</>
        );
      },
      function TermsSectionItemIpCopying() {
        return (
          <>You may not copy, modify, or distribute our proprietary content</>
        );
      },
      function TermsSectionItemIpRespectRights() {
        return <>Respect the intellectual property rights of others</>;
      },
    ],
  },
  {
    id: "service-availability",
    Title: function TermsSectionTitleServiceAvailability() {
      return <>Service Availability</>;
    },
    Items: [
      function TermsSectionItemAvailabilityUptime() {
        return (
          <>
            We strive to maintain high service availability but cannot guarantee
            100% uptime
          </>
        );
      },
      function TermsSectionItemAvailabilityMaintenance() {
        return (
          <>Scheduled maintenance will be announced in advance when possible</>
        );
      },
      function TermsSectionItemAvailabilityModifyFeatures() {
        return (
          <>We may modify or discontinue features with reasonable notice</>
        );
      },
      function TermsSectionItemAvailabilityEmergencyMaintenance() {
        return <>Emergency maintenance may occur without prior notice</>;
      },
      function TermsSectionItemAvailabilitySla() {
        return (
          <>Service level agreements are specified in your subscription plan</>
        );
      },
    ],
  },
  {
    id: "termination",
    Title: function TermsSectionTitleTermination() {
      return <>Termination</>;
    },
    Items: [
      function TermsSectionItemTerminationAnyTime() {
        return (
          <>
            You may terminate your account at any time through your account
            settings
          </>
        );
      },
      function TermsSectionItemTerminationViolations() {
        return <>We may terminate accounts that violate these terms</>;
      },
      function TermsSectionItemTerminationCeases() {
        return (
          <>
            Upon termination, your right to use the service ceases immediately
          </>
        );
      },
      function TermsSectionItemTerminationNotice() {
        return (
          <>
            We will provide reasonable notice before terminating paid accounts
          </>
        );
      },
      function TermsSectionItemTerminationExport() {
        return (
          <>Data export options are available before account termination</>
        );
      },
    ],
  },
  {
    id: "disclaimers",
    Title: function TermsSectionTitleDisclaimers() {
      return <>Disclaimers and Limitations</>;
    },
    Items: [
      function TermsSectionItemDisclaimersAsIs() {
        return (
          <>
            The service is provided &apos;as is&apos; without warranties of any
            kind
          </>
        );
      },
      function TermsSectionItemDisclaimersMerchantability() {
        return (
          <>
            We disclaim all warranties, express or implied, including
            merchantability
          </>
        );
      },
      function TermsSectionItemDisclaimersIndirectDamages() {
        return (
          <>
            We are not liable for indirect, incidental, or consequential damages
          </>
        );
      },
      function TermsSectionItemDisclaimersLiabilityCap() {
        return (
          <>
            Our total liability is limited to the amount you paid in the last 12
            months
          </>
        );
      },
      function TermsSectionItemDisclaimersJurisdictions() {
        return <>Some jurisdictions do not allow these limitations</>;
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="py-16">
      <ReadingContainer>
        <h1 className="text-foreground mb-12 text-center text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Terms of Service
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
          {termsSections.map((section) => {
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
            These Terms are interpreted under the laws that apply to the
            contracting entity operating {COMPANY_NAME}, unless mandatory local
            law requires otherwise. If any provision is unenforceable, the
            remaining provisions will remain in effect.
          </p>
        </div>
      </ReadingContainer>
    </div>
  );
}
