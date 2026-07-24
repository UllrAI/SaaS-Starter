import { getServerTranslations } from "@/lib/i18n/translation/server";
import { AuthForm } from "@/components/forms/auth-form";
import { getAvailableSocialProviders } from "@/lib/auth/providers";
import {
  DEFAULT_CALLBACK_URL,
  normalizeCallbackUrl,
} from "@/lib/auth/callback-url";
import { createMetadataDefaults } from "@/lib/metadata";
export async function generateMetadata() {
  const { t } = await getServerTranslations();
  const metadata = createMetadataDefaults();
  return {
    ...metadata,
    title: t("281732b255a5", "Sign Up"),
    description: t("5e3cc88e6fbe", "Create your account with magic link"),
    openGraph: {
      ...metadata.openGraph,
      title: t("c4df71e2debe", "Sign Up"),
      description: t("5f7b695a3008", "Create your account with magic link"),
    },
    twitter: {
      ...metadata.twitter,
      title: t("b80aefc6fb62", "Sign Up"),
      description: t("ea0e05b8ca7a", "Create your account with magic link"),
    },
  };
}
interface SignUpPageProps {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
  }>;
}
export default async function SignUpPage({ searchParams }: SignUpPageProps) {
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
      callbackURL={callbackUrl}
    />
  );
}
