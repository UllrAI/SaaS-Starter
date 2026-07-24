import { getServerTranslations } from "@/lib/i18n/translation/server";
import { getStaticTranslations } from "@/lib/i18n/translation/static";
import { LocalizedLink as Link } from "@/components/localized-link";
import {
  COMPANY_NAME,
  GITHUB_DISCUSSIONS_URL,
  LEGAL_EMAIL,
} from "@/lib/config/constants";
import { FileText } from "lucide-react";
import { ReadingContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import {
  PageIntro,
  PageIntroDescription,
  PageIntroHeading,
} from "@/components/layout/page-intro";
import {
  createLocalizedAlternates,
  createMetadataDefaults,
} from "@/lib/metadata";
import { SOURCE_LOCALE, type SupportedLocale } from "@/lib/config/i18n";
export async function buildTermsMetadata(locale: SupportedLocale) {
  const { t } = await getServerTranslations({ locale });
  const metadata = createMetadataDefaults({
    alternates: createLocalizedAlternates("/terms", locale),
    locale,
  });
  return {
    ...metadata,
    title: t("efcc00a70da5", "Terms of Service"),
    description: t(
      "159f0e052104",
      "Read our terms of service to understand your rights and responsibilities when using the product.",
    ),
    openGraph: {
      ...metadata.openGraph,
      title: t("d9707f7bff59", "Terms of Service"),
      description: t(
        "763b0e3e7565",
        "Read our terms of service to understand your rights and responsibilities when using the product.",
      ),
    },
    twitter: {
      ...metadata.twitter,
      title: t("899a851d2706", "Terms of Service"),
      description: t(
        "dd8e42a4774c",
        "Read our terms of service to understand your rights and responsibilities when using the product.",
      ),
    },
  };
}
export function generateMetadata() {
  return buildTermsMetadata(SOURCE_LOCALE);
}
export default function TermsPage({
  locale = SOURCE_LOCALE,
}: {
  locale?: SupportedLocale;
} = {}) {
  const { t } = getStaticTranslations(locale);
  const termsSections = [
    {
      id: "acceptance",
      title: <>{t("58e4e955c834", "Acceptance of Terms")}</>,
      items: [
        <>
          {t(
            "69f52bb1f232",
            "By accessing or using {COMPANY_NAME}, you agree to be bound by these Terms of Service",
            {
              COMPANY_NAME,
            },
          )}
        </>,
        <>
          {t(
            "bd2ff13de74f",
            "If you disagree with any part of these terms, you may not access the service",
          )}
        </>,
        <>
          {t(
            "6246b5f6e714",
            "These terms apply to all visitors, users, and others who access the service",
          )}
        </>,
        <>
          {t(
            "6b3f61b14322",
            "We may update these terms from time to time without prior notice",
          )}
        </>,
      ],
    },
    {
      id: "user-accounts",
      title: <>{t("f3ac6076e9f2", "User Accounts")}</>,
      items: [
        <>
          {t(
            "7ec96d702d2d",
            "You must provide accurate and complete information when creating an account",
          )}
        </>,
        <>
          {t(
            "71d517040643",
            "You are responsible for maintaining the security of your account",
          )}
        </>,
        <>
          {t(
            "a2cb2b16110b",
            "You must notify us immediately of any unauthorized use of your account",
          )}
        </>,
        <>
          {t(
            "a62b460c7c5c",
            "One person or legal entity may not maintain more than one free account",
          )}
        </>,
        <>
          {t(
            "f3e7af32e6cb",
            "Accounts registered by bots or automated methods are not permitted",
          )}
        </>,
      ],
    },
    {
      id: "acceptable-use",
      title: <>{t("c41558e56090", "Acceptable Use")}</>,
      items: [
        <>
          {t(
            "1de95508a310",
            "Use the service only for lawful purposes and in accordance with these terms",
          )}
        </>,
        <>
          {t(
            "140e310fa122",
            "Do not use the service to transmit harmful, offensive, or illegal content",
          )}
        </>,
        <>
          {t(
            "3ebb8520ffa7",
            "Do not attempt to gain unauthorized access to our systems or networks",
          )}
        </>,
        <>
          {t(
            "5f12620977b0",
            "Do not interfere with or disrupt the service or servers",
          )}
        </>,
        <>
          {t(
            "be031b76945f",
            "Do not use the service to compete with or replicate our business model",
          )}
        </>,
      ],
    },
    {
      id: "payment-terms",
      title: <>{t("5a39c9e8d369", "Payment and Billing")}</>,
      items: [
        <>
          {t(
            "e1ddd5b8244a",
            "Paid plans are billed in advance on a monthly or annual basis",
          )}
        </>,
        <>
          {t(
            "5e3ff8c4ff33",
            "All fees are non-refundable except as required by law",
          )}
        </>,
        <>
          {t(
            "a2e4882d70e6",
            "You authorize us to charge your payment method for all fees",
          )}
        </>,
        <>
          {t(
            "f12bb9650dd1",
            "Price changes will be communicated with 30 days notice",
          )}
        </>,
        <>
          {t(
            "540bbf8e1f22",
            "Failure to pay may result in service suspension or termination",
          )}
        </>,
      ],
    },
    {
      id: "intellectual-property",
      title: <>{t("e758b701b481", "Intellectual Property")}</>,
      items: [
        <>
          {t(
            "c3c569d3b57c",
            "The service and its content are protected by copyright and other laws",
          )}
        </>,
        <>
          {t(
            "cdbbe76b0b98",
            "You retain ownership of content you create using our service",
          )}
        </>,
        <>
          {t(
            "68a8d2397358",
            "You grant us a license to use your content to provide the service",
          )}
        </>,
        <>
          {t(
            "06709e943aad",
            "You may not copy, modify, or distribute our proprietary content",
          )}
        </>,
        <>
          {t(
            "3e51aab5c054",
            "Respect the intellectual property rights of others",
          )}
        </>,
      ],
    },
    {
      id: "service-availability",
      title: <>{t("b52dc2c3bd37", "Service Availability")}</>,
      items: [
        <>
          {t(
            "520b24d706c4",
            "We strive to maintain high service availability but cannot guarantee 100% uptime",
          )}
        </>,
        <>
          {t(
            "4377d57ff26f",
            "Scheduled maintenance will be announced in advance when possible",
          )}
        </>,
        <>
          {t(
            "0c615d8df8fa",
            "We may modify or discontinue features with reasonable notice",
          )}
        </>,
        <>
          {t(
            "d33f5de8f32f",
            "Emergency maintenance may occur without prior notice",
          )}
        </>,
        <>
          {t(
            "daffbd099aa5",
            "Service level agreements are specified in your subscription plan",
          )}
        </>,
      ],
    },
    {
      id: "termination",
      title: <>{t("fcd94f03402d", "Termination")}</>,
      items: [
        <>
          {t(
            "b9ef75368350",
            "You may terminate your account at any time through your account settings",
          )}
        </>,
        <>
          {t(
            "514b6948a14e",
            "We may terminate accounts that violate these terms",
          )}
        </>,
        <>
          {t(
            "8c6d56781485",
            "Upon termination, your right to use the service ceases immediately",
          )}
        </>,
        <>
          {t(
            "b5a461f7d146",
            "We will provide reasonable notice before terminating paid accounts",
          )}
        </>,
        <>
          {t(
            "302f80d766ed",
            "Data export options are available before account termination",
          )}
        </>,
      ],
    },
    {
      id: "disclaimers",
      title: <>{t("05aecbcb02ee", "Disclaimers and Limitations")}</>,
      items: [
        <>
          {t(
            "29d7aaf3e97d",
            "The service is provided 'as is' without warranties of any kind",
          )}
        </>,
        <>
          {t(
            "94f86f086d83",
            "We disclaim all warranties, express or implied, including merchantability",
          )}
        </>,
        <>
          {t(
            "2bbba37cf847",
            "We are not liable for indirect, incidental, or consequential damages",
          )}
        </>,
        <>
          {t(
            "fc64b703e345",
            "Our total liability is limited to the amount you paid in the last 12 months",
          )}
        </>,
        <>
          {t(
            "cdb9bbd50344",
            "Some jurisdictions do not allow these limitations",
          )}
        </>,
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
              <FileText className="text-muted-foreground mr-2 h-3 w-3" />
              <span className="text-muted-foreground font-mono">
                {t("d9e77b08ea7d", "TERMS.md")}
              </span>
            </Badge>
          }
        >
          <PageIntroHeading>
            {t("5213e484bad3", "Terms of Service")}
          </PageIntroHeading>
          <PageIntroDescription className="mb-10">
            {t(
              "7e20b9a8480d",
              "These terms govern your use of {COMPANY_NAME} and outline the rights and responsibilities of both you and us. Please read them carefully.",
              {
                COMPANY_NAME,
              },
            )}
          </PageIntroDescription>
          <div className="text-muted-foreground text-sm">
            <p>{t("25d1aaa63fd9", "Last updated: December 2024")}</p>
            <p>{t("a6af1b29f56c", "Effective: December 1, 2024")}</p>
          </div>
        </PageIntro>

        <div className="space-y-8">
          {termsSections.map((section) => {
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
            {t("7602c9d869e0", "Questions About These Terms?")}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t(
              "504c623646d9",
              "If you have any questions about these Terms of Service, please contact our legal team.",
            )}
          </p>
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              <strong>{t("556b2798daa9", "Email:")}</strong> {LEGAL_EMAIL}
            </p>
            <p>
              <strong>{t("cb7a3f78f46f", "Support:")}</strong>{" "}
              <Link
                href="/contact"
                locale={locale}
                className="underline underline-offset-4"
              >
                {t("f675139b980f", "Contact page")}
              </Link>
            </p>
            <p>
              <strong>{t("0966bfddd08d", "Community:")}</strong>{" "}
              <a
                href={GITHUB_DISCUSSIONS_URL}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                {t("3b1ce74297f7", "GitHub Discussions")}
              </a>
            </p>
          </div>
        </div>

        <div className="text-muted-foreground mt-12 border-t pt-8 text-center text-sm">
          <p>
            {t(
              "7de7d0471c2b",
              "These Terms are interpreted under the laws that apply to the contracting entity operating {COMPANY_NAME}, unless mandatory local law requires otherwise. If any provision is unenforceable, the remaining provisions will remain in effect.",
              {
                COMPANY_NAME,
              },
            )}
          </p>
        </div>
      </ReadingContainer>
    </div>
  );
}
