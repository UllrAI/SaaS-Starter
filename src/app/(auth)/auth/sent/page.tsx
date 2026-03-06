import { LinkSentCard } from "@/components/auth/link-sent-card";

interface MagicLinkSentPageProps {
  searchParams: Promise<{
    email?: string;
  }>;
}

export default async function MagicLinkSent({
  searchParams,
}: MagicLinkSentPageProps) {
  const { email } = await searchParams;

  const description = (
    <div className="space-y-3">
      <p>We&apos;ve sent a secure magic-link to</p>
      <p className="text-foreground break-all font-bold">
        {email || "your email address"}
      </p>
      <p>Click the link in the email to sign in.</p>
    </div>
  );

  return (
    <LinkSentCard
      title="Check your email"
      description={description}
      retryHref="/login"
    />
  );
}
