import { AuthForm } from "@/components/forms/auth-form";
import { getAvailableSocialProviders } from "@/lib/auth/providers";
import {
  DEFAULT_CALLBACK_URL,
  normalizeCallbackUrl,
} from "@/lib/auth/callback-url";
import { createMetadata } from "@/lib/metadata";
import { resolveAuthFeedback } from "@/lib/auth/feedback";

export async function generateMetadata() {
  const metadata = createMetadata({});

  return {
    ...metadata,
    title: "Sign In",
    description: "Sign in to your account with magic link",
    openGraph: {
      ...metadata.openGraph,
      title: "Sign In",
      description: "Sign in to your account with magic link",
    },
    twitter: {
      ...metadata.twitter,
      title: "Sign In",
      description: "Sign in to your account with magic link",
    },
  };
}

interface LoginPageProps {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
    authError?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const availableProviders = getAvailableSocialProviders();
  const resolvedSearchParams: Awaited<NonNullable<LoginPageProps["searchParams"]>> =
    searchParams ? await searchParams : {};
  const rawCallbackUrl = resolvedSearchParams.callbackUrl;
  const callbackUrl = normalizeCallbackUrl(
    Array.isArray(rawCallbackUrl) ? rawCallbackUrl[0] : rawCallbackUrl,
    DEFAULT_CALLBACK_URL,
  );
  const authError = resolvedSearchParams.authError;
  const error = resolvedSearchParams.error;
  const errorDescription = resolvedSearchParams.error_description;
  const feedback = resolveAuthFeedback({
    authError: Array.isArray(authError) ? authError[0] : authError,
    error: Array.isArray(error) ? error[0] : error,
    errorDescription: Array.isArray(errorDescription)
      ? errorDescription[0]
      : errorDescription,
  });

  return (
    <AuthForm
      mode="login"
      availableProviders={availableProviders}
      callbackURL={callbackUrl}
      initialFeedback={feedback}
    />
  );
}
