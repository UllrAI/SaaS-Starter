"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { signIn } from "@/lib/auth/client";
import { authSchema } from "@/schemas/auth.schema";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAvailableSocialProviders } from "@/lib/auth/providers";
import { AuthFormBase } from "@/components/auth/auth-form-base";
import {
  type ResolvedAuthFeedback,
} from "@/lib/auth/feedback";
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

    const statusResponse = await fetch(
      `/api/auth/account-status?email=${encodeURIComponent(data.email)}`,
    );
    const statusPayload = (await statusResponse.json()) as {
      status: "active" | "banned";
      feedback?: ResolvedAuthFeedback | null;
    };

    if (statusPayload.status === "banned") {
      setFeedback(statusPayload.feedback ?? { key: "banned" });
      setPendingAction(null);
      return;
    }

    const result = await signIn.magicLink({
      email: data.email,
      callbackURL: resolvedCallbackURL,
      errorCallbackURL,
    });

    if (result.error) {
      toast.error(result.error.message);
      setPendingAction(null);
      return;
    }

    // Navigate to the unified sent page with the email as a query param
    const params = new URLSearchParams({ email: data.email });
    router.push(`/auth/sent?${params.toString()}`);
  };

  const isLogin = mode === "login";

  const config = {
    title: isLogin ? <>Welcome back</> : <>Get started today</>,
    description: isLogin
      ? <>Enter your email to receive a secure magic link and access your dashboard</>
      : <>Create your account in seconds with just your email address</>,
    badgeText: isLogin ? <>Welcome back</> : <>Get started</>,
    submitButtonText: isLogin ? <>Send Magic Link</> : <>Create Account</>,
    magicLinkLoadingText: <>Sending magic link...</>,
    submitIcon: Mail,
    alternativeActionText: isLogin
      ? <>New to our platform?</>
      : <>Already have an account?</>,
    alternativeActionLink: (
      <Link
        href={isLogin ? `/signup${callbackQuery}` : `/login${callbackQuery}`}
        className="text-primary hover:text-primary/80 cursor-pointer font-medium underline-offset-4 transition-colors hover:underline"
      >
        {isLogin ? <>Create an account</> : <>Sign in instead</>}
      </Link>
    ),
    showTerms: !isLogin,
    callbackURL: resolvedCallbackURL,
  };

  const fields = [
    {
      name: "email" as const,
      label: <>Email address</>,
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
