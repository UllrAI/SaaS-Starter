import { AuthForm } from "@/components/forms/auth-form";
import { getAvailableSocialProviders } from "@/lib/auth/providers";
import { createMetadata } from "@/lib/metadata";
import {
  DEFAULT_CALLBACK_URL,
  normalizeCallbackUrl,
} from "@/lib/auth/callback-url";

export const metadata = createMetadata({
  title: "Sign In",
  description: "Sign in to your account with magic link",
});

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
