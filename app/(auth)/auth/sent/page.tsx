'use client'; // This page now needs client-side logic to read params

import { useSearchParams } from 'next/navigation';
import { LinkSentCard } from "@/components/auth/link-sent-card";

export default function MagicLinkSent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const description = (
    <>
      We&apos;ve sent a secure magic-link to <br />
      <span className="font-bold text-foreground">{email || "your email address"}</span>.
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