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
import { trackUmamiEvent } from "@/lib/analytics/umami";
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
  const newUserCallbackURL =
    mode === "signup"
      ? withSignupSuccessSignal(resolvedCallbackURL)
      : undefined;
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
  const isLogin = mode === "login";
  const onSubmit = async (data: z.infer<typeof authSchema>) => {
    trackUmamiEvent(isLogin ? "login_submit" : "signup_submit", {
      method: "magic_link",
    });
    setFeedback(null);
    form.clearErrors("email");
    const result = await signIn.magicLink({
      email: data.email,
      callbackURL: resolvedCallbackURL,
      errorCallbackURL,
      ...(newUserCallbackURL ? { newUserCallbackURL } : {}),
    });
    if (result.error) {
      setFeedback({
        key: "sign_in_failed",
      });
      setPendingAction(null);
      return;
    }

    trackUmamiEvent(isLogin ? "login_link_sent" : "signup_link_sent", {
      method: "magic_link",
    });

    router.push("/auth/sent");
  };
  const config = {
    title: isLogin ? (
      <>{t("auth_welcome_back")}</>
    ) : (
      <>{t("auth_get_started_today")}</>
    ),
    description: emailAuthEnabled ? (
      isLogin ? (
        <>{t("auth_enter_email_receive_secure_magic_link")}</>
      ) : (
        <>{t("auth_create_account_in_seconds_just_email")}</>
      )
    ) : isLogin ? (
      <>{t("auth_oauth_login_description")}</>
    ) : (
      <>{t("auth_oauth_signup_description")}</>
    ),
    badgeText: isLogin ? (
      <>{t("auth_welcome_back")}</>
    ) : (
      <>{t("auth_get_started")}</>
    ),
    submitButtonText: isLogin ? (
      <>{t("auth_send_magic_link")}</>
    ) : (
      <>{t("auth_create_account")}</>
    ),
    magicLinkLoadingText: <>{t("auth_sending_magic_link")}</>,
    submitIcon: Mail,
    alternativeActionText: isLogin ? (
      <>{t("auth_new_platform")}</>
    ) : (
      <>{t("auth_already_have_account")}</>
    ),
    alternativeActionLink: (
      <Link
        href={isLogin ? `/signup${callbackQuery}` : `/login${callbackQuery}`}
        className="text-primary hover:text-primary/80 cursor-pointer font-medium underline-offset-4 transition-colors hover:underline"
      >
        {isLogin ? (
          <>{t("auth_create_account_alternative")}</>
        ) : (
          <>{t("auth_sign_in_instead")}</>
        )}
      </Link>
    ),
    showTerms: !isLogin,
    callbackURL: resolvedCallbackURL,
    newUserCallbackURL,
  };
  const fields = [
    {
      name: "email" as const,
      label: <>{t("auth_email_address")}</>,
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

function withSignupSuccessSignal(callbackURL: string): string {
  const url = new URL(callbackURL, "http://localhost");
  url.searchParams.set("signup", "success");
  return `${url.pathname}${url.search}${url.hash}`;
}
