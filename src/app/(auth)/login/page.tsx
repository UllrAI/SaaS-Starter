import { getServerTranslations } from "@/lib/i18n/translation/server";
import { AuthForm } from "@/components/forms/auth-form";
import { getAvailableSocialProviders } from "@/lib/auth/providers";
import {
  DEFAULT_CALLBACK_URL,
  normalizeCallbackUrl,
} from "@/lib/auth/callback-url";
import { createMetadataDefaults } from "@/lib/metadata";
import { resolveAuthFeedback } from "@/lib/auth/feedback";
import { requireGuest } from "@/lib/auth/permissions";
import { SITE_CONFIG } from "@/lib/config/site";

export async function generateMetadata() {
  const { locale, t } = await getServerTranslations();
  const metadata = createMetadataDefaults({ locale });
  return {
    ...metadata,
    title: t("auth_sign_in"),
    description: t("auth_sign_in_account_magic_link"),
    openGraph: {
      ...metadata.openGraph,
      title: t("auth_sign_in"),
      description: t("auth_sign_in_account_magic_link"),
    },
    twitter: {
      ...metadata.twitter,
      title: t("auth_sign_in"),
      description: t("auth_sign_in_account_magic_link"),
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
  await requireGuest();

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
      emailAuthEnabled={SITE_CONFIG.features.emailAuth}
      callbackURL={callbackUrl}
      initialFeedback={feedback}
    />
  );
}
