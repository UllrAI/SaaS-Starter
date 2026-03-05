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
    <>
      We&apos;ve sent a secure magic-link to <br />
      <span className="text-foreground font-bold">
        {email || "your email address"}
      </span>
      .
      <br /> Click the link in the email to sign in.
    </>
  );

  return (
    <LinkSentCard
      title="Check your email"
      description={description}
      retryHref="/login"
    />
  );
}
