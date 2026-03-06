import { createPageMetadata } from "@/lib/i18n/page-metadata";

async function AuthSentMetadataTitle() {
  return <>Check Your Email - Magic Link Sent</>;
}

async function AuthSentMetadataDescription() {
  return <>We&apos;ve sent you a secure magic link to access your account</>;
}

export async function generateMetadata() {
  return createPageMetadata({
    title: AuthSentMetadataTitle,
    description: AuthSentMetadataDescription,
  });
}

export default function SentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
