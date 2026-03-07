import { createMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const metadata = createMetadata({});

  return {
    ...metadata,
    title: "Check Your Email - Magic Link Sent",
    description: "We've sent you a secure magic link to access your account",
    openGraph: {
      ...metadata.openGraph,
      title: "Check Your Email - Magic Link Sent",
      description: "We've sent you a secure magic link to access your account",
    },
    twitter: {
      ...metadata.twitter,
      title: "Check Your Email - Magic Link Sent",
      description: "We've sent you a secure magic link to access your account",
    },
  };
}

export default function SentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
