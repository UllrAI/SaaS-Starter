import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";

export interface MagicLinkEmailDeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
  location?: string;
  ip?: string;
}

export interface MagicLinkEmailCopy {
  preview: string;
  heading: string;
  intro: string;
  greeting: string;
  requestDetails: string;
  cta: string;
  securityReminder: string;
  fallback: string;
  sentToLabel: string;
  footer: string;
  deviceDetailsTitle?: string;
  deviceLine?: string;
  locationLine?: string;
}

export interface MagicLinkEmailTemplateProps {
  copy: MagicLinkEmailCopy;
  email: string;
  url: string;
  appName: string;
  locale: string;
}

const theme = {
  background: "#fbfcfd",
  surface: "#ffffff",
  surfaceMuted: "#eff2f5",
  border: "#dfe6eb",
  foreground: "#040c13",
  muted: "#67737c",
  primary: "#1b3478",
  primaryDark: "#14285d",
  primaryForeground: "#f8f8f8",
  link: "#1b3478",
  shadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
} as const;

const styles = {
  body: {
    margin: "0",
    padding: "0",
    backgroundColor: theme.background,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    color: theme.foreground,
  },
  wrapper: {
    width: "100%",
    backgroundColor: theme.background,
    padding: "32px 16px",
  },
  container: {
    width: "100%",
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: "0",
    overflow: "hidden",
    boxShadow: theme.shadow,
  },
  header: {
    padding: "28px 32px 24px",
    borderTop: `4px solid ${theme.primary}`,
  },
  content: {
    padding: "32px",
  },
  footer: {
    padding: "24px 32px",
    backgroundColor: theme.surfaceMuted,
  },
  brand: {
    fontSize: "12px",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: theme.primary,
    margin: "0 0 10px 0",
    fontFamily:
      "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
    fontWeight: "700",
  },
  heading: {
    fontSize: "28px",
    lineHeight: "36px",
    fontWeight: "700",
    color: theme.foreground,
    margin: "0",
  },
  intro: {
    fontSize: "15px",
    lineHeight: "22px",
    color: theme.muted,
    margin: "12px 0 0 0",
  },
  text: {
    fontSize: "15px",
    lineHeight: "24px",
    color: theme.foreground,
    margin: "0 0 18px 0",
  },
  buttonSection: {
    textAlign: "left" as const,
    margin: "28px 0",
  },
  button: {
    backgroundColor: theme.primary,
    borderRadius: "0",
    color: theme.primaryForeground,
    display: "inline-block",
    fontSize: "15px",
    fontWeight: "700",
    lineHeight: "1",
    textDecoration: "none",
    padding: "14px 22px",
    border: `1px solid ${theme.primaryDark}`,
  },
  detailsCard: {
    backgroundColor: theme.surfaceMuted,
    border: `1px solid ${theme.border}`,
    borderRadius: "0",
    padding: "16px",
    margin: "24px 0",
  },
  detailsTitle: {
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: "600",
    color: theme.foreground,
    margin: "0 0 10px 0",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  detailsLine: {
    fontSize: "14px",
    lineHeight: "20px",
    color: theme.muted,
    margin: "0 0 4px 0",
  },
  securityNote: {
    fontSize: "13px",
    lineHeight: "20px",
    color: theme.muted,
    margin: "28px 0 0 0",
    padding: "14px",
    borderRadius: "0",
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.surfaceMuted,
  },
  fallback: {
    fontSize: "14px",
    lineHeight: "22px",
    color: theme.muted,
    margin: "24px 0 0 0",
  },
  url: {
    fontSize: "12px",
    lineHeight: "18px",
    color: theme.link,
    margin: "8px 0 0 0",
    wordBreak: "break-all" as const,
    padding: "12px",
    backgroundColor: theme.surfaceMuted,
    borderRadius: "0",
    border: `1px solid ${theme.border}`,
    fontFamily:
      "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
  },
  footerText: {
    fontSize: "12px",
    lineHeight: "18px",
    color: theme.muted,
    margin: "0 0 8px 0",
    textAlign: "left" as const,
  },
  footerMeta: {
    fontSize: "12px",
    lineHeight: "18px",
    color: theme.muted,
    margin: "0",
    textAlign: "left" as const,
  },
  footerLink: {
    color: theme.link,
    textDecoration: "none",
    fontWeight: "600",
  },
  separator: {
    borderColor: theme.border,
    margin: "0",
  },
} as const;

export async function MagicLinkEmailSubject({
  appName,
}: {
  appName: string;
}) {
  return <>Your secure sign-in link for {appName}</>;
}

export async function MagicLinkEmailPreview({
  appName,
}: {
  appName: string;
}) {
  return (
    <>
      Click the secure button below to complete your sign-in process. Your
      secure sign-in link for {appName}
    </>
  );
}

export async function MagicLinkEmailHeading() {
  return <>Access your account securely</>;
}

export async function MagicLinkEmailIntro() {
  return <>Use the link below to finish signing in.</>;
}

export async function MagicLinkEmailGreeting() {
  return <>Hello,</>;
}

export async function MagicLinkEmailRequestDetails({
  appName,
}: {
  appName: string;
}) {
  return (
    <>
      We received a request to sign in to your {appName} account. Select the
      button below to continue.
    </>
  );
}

export async function MagicLinkEmailCta() {
  return <>Open sign-in link</>;
}

export async function MagicLinkEmailSecurityReminder() {
  return (
    <>
      Security reminder: This link expires in 15 minutes. If you did not
      request it, you can safely ignore this message.
    </>
  );
}

export async function MagicLinkEmailFallback() {
  return (
    <>
      If the button doesn&apos;t work, you can copy and paste this link into
      your browser:
    </>
  );
}

export async function MagicLinkEmailSentToLabel() {
  return <>Sent to</>;
}

export async function MagicLinkEmailFooter({
  currentYear,
  appName,
  companyName,
  formattedDate,
}: {
  currentYear: number;
  appName: string;
  companyName: string;
  formattedDate: string;
}) {
  return (
    <>
      &copy; {currentYear} {appName}, {companyName}. All rights reserved. |{" "}
      {formattedDate}
    </>
  );
}

export async function MagicLinkEmailDeviceDetailsTitle() {
  return <>Sign-in request details</>;
}

export async function MagicLinkEmailDeviceLine({
  browser,
  os,
}: {
  browser: string;
  os: string;
}) {
  return <>Device: {browser} on {os}</>;
}

export async function MagicLinkEmailLocationLine({
  location,
}: {
  location: string;
}) {
  return <>Location: {location} (approximate)</>;
}

export function MagicLinkEmailTemplate({
  copy,
  email,
  url,
  appName,
  locale,
}: MagicLinkEmailTemplateProps) {
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={styles.body}>
        <Section style={styles.wrapper}>
          <Container style={styles.container}>
            <Section style={styles.header}>
              <Text style={styles.brand}>{appName}</Text>
              <Heading as="h1" style={styles.heading}>
                {copy.heading}
              </Heading>
              <Text style={styles.intro}>{copy.intro}</Text>
            </Section>

            <Hr style={styles.separator} />

            <Section style={styles.content}>
              <Text style={styles.text}>{copy.greeting}</Text>
              <Text style={styles.text}>{copy.requestDetails}</Text>

              <Section style={styles.buttonSection}>
                <Button href={url} style={styles.button}>
                  {copy.cta}
                </Button>
              </Section>

              {copy.deviceLine || copy.locationLine ? (
                <Section style={styles.detailsCard}>
                  <Text style={styles.detailsTitle}>
                    {copy.deviceDetailsTitle}
                  </Text>
                  {copy.deviceLine ? (
                    <Text style={styles.detailsLine}>{copy.deviceLine}</Text>
                  ) : null}
                  {copy.locationLine ? (
                    <Text style={{ ...styles.detailsLine, margin: 0 }}>
                      {copy.locationLine}
                    </Text>
                  ) : null}
                </Section>
              ) : null}

              <Text style={styles.securityNote}>{copy.securityReminder}</Text>
              <Text style={styles.fallback}>{copy.fallback}</Text>
              <Text style={styles.url}>{url}</Text>
            </Section>

            <Hr style={styles.separator} />

            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                {copy.sentToLabel}{" "}
                <Link href={`mailto:${email}`} style={styles.footerLink}>
                  {email}
                </Link>
              </Text>
              <Text style={styles.footerMeta}>{copy.footer}</Text>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}

export async function renderMagicLinkEmail({
  copy,
  email,
  url,
  appName,
  locale,
}: MagicLinkEmailTemplateProps) {
  const template = (
    <MagicLinkEmailTemplate
      copy={copy}
      email={email}
      url={url}
      appName={appName}
      locale={locale}
    />
  );

  const html = await render(template);
  const text = await render(template, { plainText: true });

  return { html, text };
}
