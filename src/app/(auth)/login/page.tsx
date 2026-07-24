import { getServerTranslations } from "@/lib/i18n/translation/server";
import { AuthForm } from "@/components/forms/auth-form";
import { getAvailableSocialProviders } from "@/lib/auth/providers";
import {
  DEFAULT_CALLBACK_URL,
  normalizeCallbackUrl,
} from "@/lib/auth/callback-url";
import { createMetadataDefaults } from "@/lib/metadata";
import { resolveAuthFeedback } from "@/lib/auth/feedback";
export async function generateMetadata() {
  const { locale, t } = await getServerTranslations();
  const metadata = createMetadataDefaults({ locale });
  return {
    ...metadata,
    title: t("111d958bf0a6", "Sign In"),
    description: t("1e71a537208b", "Sign in to your account with magic link"),
    openGraph: {
      ...metadata.openGraph,
      title: t("05b393ebf2a7", "Sign In"),
      description: t("8f7769766bfe", "Sign in to your account with magic link"),
    },
    twitter: {
      ...metadata.twitter,
      title: t("75f312462374", "Sign In"),
      description: t("fa4d2b7413ea", "Sign in to your account with magic link"),
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
  const resolvedSearchParams: Awaited<
    NonNullable<LoginPageProps["searchParams"]>
  > = searchParams ? await searchParams : {};
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
