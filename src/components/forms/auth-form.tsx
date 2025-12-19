"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
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

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
  availableProviders?: ReturnType<typeof getAvailableSocialProviders>;
}

export function AuthForm({ mode, availableProviders }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof authSchema>) => {
    const result = await signIn.magicLink({
      email: data.email,
      callbackURL: "/dashboard",
    });

    if (result.error) {
      toast.error(result.error.message);
      setLoading(false);
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
    loadingText: <>Sending magic link...</>,
    submitIcon: Mail,
    alternativeActionText: isLogin
      ? <>New to our platform?</>
      : <>Already have an account?</>,
    alternativeActionLink: (
      <Link
        href={isLogin ? "/signup" : "/login"}
        className="text-primary hover:text-primary/80 cursor-pointer font-medium underline-offset-4 transition-colors hover:underline"
      >
        {isLogin ? <>Create an account</> : <>Sign in instead</>}
      </Link>
    ),
    showTerms: !isLogin,
    callbackURL: "/dashboard",
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
      loading={loading}
      setLoading={setLoading}
      config={config}
      fields={fields}
      availableProviders={availableProviders}
    />
  );
}
