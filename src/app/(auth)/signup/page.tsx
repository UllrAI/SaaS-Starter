import { getServerTranslations } from "@/lib/i18n/translation/server";
import { AuthForm } from "@/components/forms/auth-form";
import { getAvailableSocialProviders } from "@/lib/auth/providers";
import {
  DEFAULT_CALLBACK_URL,
  normalizeCallbackUrl,
} from "@/lib/auth/callback-url";
import { requireGuest } from "@/lib/auth/permissions";
import { createMetadataDefaults } from "@/lib/metadata";
import { SITE_CONFIG } from "@/lib/config/site";

export async function generateMetadata() {
  const { locale, t } = await getServerTranslations();
  const metadata = createMetadataDefaults({ locale });
  return {
    ...metadata,
    title: t("auth_sign_up"),
    description: t("auth_create_account_magic_link"),
    openGraph: {
      ...metadata.openGraph,
      title: t("auth_sign_up"),
      description: t("auth_create_account_magic_link"),
    },
    twitter: {
      ...metadata.twitter,
      title: t("auth_sign_up"),
      description: t("auth_create_account_magic_link"),
    },
  };
}
interface SignUpPageProps {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
  }>;
}
export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  await requireGuest();

  const availableProviders = getAvailableSocialProviders();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rawCallbackUrl = resolvedSearchParams.callbackUrl;
  const callbackUrl = normalizeCallbackUrl(
    Array.isArray(rawCallbackUrl) ? rawCallbackUrl[0] : rawCallbackUrl,
    DEFAULT_CALLBACK_URL,
  );
  return (
    <AuthForm
      mode="signup"
      availableProviders={availableProviders}
      emailAuthEnabled={SITE_CONFIG.features.emailAuth}
      callbackURL={callbackUrl}
    />
  );
}
