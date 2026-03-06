import { AuthForm } from "@/components/forms/auth-form";
import { getAvailableSocialProviders } from "@/lib/auth/providers";
import {
  DEFAULT_CALLBACK_URL,
  normalizeCallbackUrl,
} from "@/lib/auth/callback-url";
import { createLocalizedMetadata } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return createLocalizedMetadata({
    en: {
      title: "Sign In",
      description: "Sign in to your account with magic link",
    },
    "zh-Hans": {
      title: "登录",
      description: "使用魔法链接登录您的账户",
    },
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
