"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { signIn } from "@/lib/auth/client";
import { authSchema } from "@/schemas/auth.schema";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import type { SocialProvider } from "@/lib/auth/providers";
import { AuthFormBase } from "@/components/auth/auth-form-base";
import { type ResolvedAuthFeedback } from "@/lib/auth/feedback";
import {
  DEFAULT_CALLBACK_URL,
  buildLoginRedirectPath,
  normalizeCallbackUrl,
} from "@/lib/auth/callback-url";
type AuthMode = "login" | "signup";
type AuthPendingAction = "magic-link" | "social" | null;
interface AuthFormProps {
  mode: AuthMode;
  availableProviders?: SocialProvider[];
  emailAuthEnabled?: boolean;
  callbackURL?: string;
  initialFeedback?: ResolvedAuthFeedback | null;
}
export function AuthForm({
  mode,
  availableProviders,
  emailAuthEnabled = true,
  callbackURL = DEFAULT_CALLBACK_URL,
  initialFeedback = null,
}: AuthFormProps) {
  const { t } = useTranslation();
  const [pendingAction, setPendingAction] = useState<AuthPendingAction>(null);
  const [feedback, setFeedback] = useState<ResolvedAuthFeedback | null>(
    initialFeedback,
  );
  const router = useRouter();
  const resolvedCallbackURL = normalizeCallbackUrl(callbackURL);
  const errorCallbackURL = buildLoginRedirectPath(resolvedCallbackURL);
  const callbackQuery =
    resolvedCallbackURL === DEFAULT_CALLBACK_URL
      ? ""
      : `?callbackUrl=${encodeURIComponent(resolvedCallbackURL)}`;
  useEffect(() => {
    if (emailAuthEnabled) {
      router.prefetch("/auth/sent");
    }
    if (resolvedCallbackURL.startsWith("/")) {
      router.prefetch(resolvedCallbackURL);
    }
  }, [emailAuthEnabled, resolvedCallbackURL, router]);
  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
    },
  });
  const onSubmit = async (data: z.infer<typeof authSchema>) => {
    setFeedback(null);
    form.clearErrors("email");
    const result = await signIn.magicLink({
      email: data.email,
      callbackURL: resolvedCallbackURL,
      errorCallbackURL,
    });
    if (result.error) {
      setFeedback({
        key: "sign_in_failed",
      });
      setPendingAction(null);
      return;
    }

    router.push("/auth/sent");
  };
  const isLogin = mode === "login";
  const config = {
    title: isLogin ? (
      <>{t("auth_welcome_back", "Welcome back")}</>
    ) : (
      <>{t("auth_get_started_today", "Get started today")}</>
    ),
    description: emailAuthEnabled ? (
      isLogin ? (
        <>
          {t(
            "auth_enter_email_receive_secure_magic_link",
            "Enter your email to receive a secure magic link and access your dashboard",
          )}
        </>
      ) : (
        <>
          {t(
            "auth_create_account_in_seconds_just_email",
            "Create your account in seconds with just your email address",
          )}
        </>
      )
    ) : isLogin ? (
      <>
        {t(
          "auth_oauth_login_description",
          "Choose a connected account to access your dashboard",
        )}
      </>
    ) : (
      <>
        {t(
          "auth_oauth_signup_description",
          "Choose a connected account to create your account",
        )}
      </>
    ),
    badgeText: isLogin ? (
      <>{t("auth_welcome_back", "Welcome back")}</>
    ) : (
      <>{t("auth_get_started", "Get started")}</>
    ),
    submitButtonText: isLogin ? (
      <>{t("auth_send_magic_link", "Send Magic Link")}</>
    ) : (
      <>{t("auth_create_account", "Create Account")}</>
    ),
    magicLinkLoadingText: (
      <>{t("auth_sending_magic_link", "Sending magic link...")}</>
    ),
    submitIcon: Mail,
    alternativeActionText: isLogin ? (
      <>{t("auth_new_platform", "New to our platform?")}</>
    ) : (
      <>{t("auth_already_have_account", "Already have an account?")}</>
    ),
    alternativeActionLink: (
      <Link
        href={isLogin ? `/signup${callbackQuery}` : `/login${callbackQuery}`}
        className="text-primary hover:text-primary/80 cursor-pointer font-medium underline-offset-4 transition-colors hover:underline"
      >
        {isLogin ? (
          <>{t("auth_create_account_alternative", "Create an account")}</>
        ) : (
          <>{t("auth_sign_in_instead", "Sign in instead")}</>
        )}
      </Link>
    ),
    showTerms: !isLogin,
    callbackURL: resolvedCallbackURL,
  };
  const fields = [
    {
      name: "email" as const,
      label: <>{t("auth_email_address", "Email address")}</>,
      placeholder: "you@example.com",
      icon: Mail,
      type: "email",
    },
  ];
  return (
    <AuthFormBase
      form={form}
      onSubmit={onSubmit}
      pendingAction={pendingAction}
      setPendingAction={setPendingAction}
      config={config}
      fields={fields}
      availableProviders={availableProviders}
      feedback={feedback}
      showMagicLink={emailAuthEnabled}
    />
  );
}
