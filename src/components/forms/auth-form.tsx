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
import { getAvailableSocialProviders } from "@/lib/auth/providers";
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
  availableProviders?: ReturnType<typeof getAvailableSocialProviders>;
  callbackURL?: string;
  initialFeedback?: ResolvedAuthFeedback | null;
}
export function AuthForm({
  mode,
  availableProviders,
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
    router.prefetch("/auth/sent");
    if (resolvedCallbackURL.startsWith("/")) {
      router.prefetch(resolvedCallbackURL);
    }
  }, [resolvedCallbackURL, router]);
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
      <>{t("7aa5451aa914", "Welcome back")}</>
    ) : (
      <>{t("d5849f34a6d7", "Get started today")}</>
    ),
    description: isLogin ? (
      <>
        {t(
          "afba6ba3fcb4",
          "Enter your email to receive a secure magic link and access your dashboard",
        )}
      </>
    ) : (
      <>
        {t(
          "7aeedd14c669",
          "Create your account in seconds with just your email address",
        )}
      </>
    ),
    badgeText: isLogin ? (
      <>{t("7aa5451aa914", "Welcome back")}</>
    ) : (
      <>{t("e334763ef2a0", "Get started")}</>
    ),
    submitButtonText: isLogin ? (
      <>{t("407dedf29c3d", "Send Magic Link")}</>
    ) : (
      <>{t("3852c62c7d11", "Create Account")}</>
    ),
    magicLinkLoadingText: <>{t("006f24988b60", "Sending magic link...")}</>,
    submitIcon: Mail,
    alternativeActionText: isLogin ? (
      <>{t("545a0cdce44c", "New to our platform?")}</>
    ) : (
      <>{t("5576cc46c7be", "Already have an account?")}</>
    ),
    alternativeActionLink: (
      <Link
        href={isLogin ? `/signup${callbackQuery}` : `/login${callbackQuery}`}
        className="text-primary hover:text-primary/80 cursor-pointer font-medium underline-offset-4 transition-colors hover:underline"
      >
        {isLogin ? (
          <>{t("d777a1a39c5d", "Create an account")}</>
        ) : (
          <>{t("6d9375362840", "Sign in instead")}</>
        )}
      </Link>
    ),
    showTerms: !isLogin,
    callbackURL: resolvedCallbackURL,
  };
  const fields = [
    {
      name: "email" as const,
      label: <>{t("531e1f599f7c", "Email address")}</>,
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
    />
  );
}
