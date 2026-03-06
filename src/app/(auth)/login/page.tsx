import { AuthForm } from "@/components/forms/auth-form";
import { getAvailableSocialProviders } from "@/lib/auth/providers";
import {
  DEFAULT_CALLBACK_URL,
  normalizeCallbackUrl,
} from "@/lib/auth/callback-url";
import { createPageMetadata } from "@/lib/i18n/page-metadata";

async function LoginPageMetadataTitle() {
  return <>Sign In</>;
}

async function LoginPageMetadataDescription() {
  return <>Sign in to your account with magic link</>;
}

export async function generateMetadata() {
  return createPageMetadata({
    title: LoginPageMetadataTitle,
    description: LoginPageMetadataDescription,
  });
}

interface LoginPageProps {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const availableProviders = getAvailableSocialProviders();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rawCallbackUrl = resolvedSearchParams.callbackUrl;
  const callbackUrl = normalizeCallbackUrl(
    Array.isArray(rawCallbackUrl) ? rawCallbackUrl[0] : rawCallbackUrl,
    DEFAULT_CALLBACK_URL,
  );

  return (
    <AuthForm
      mode="login"
      availableProviders={availableProviders}
      callbackURL={callbackUrl}
    />
  );
}
