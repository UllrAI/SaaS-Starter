"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Github } from "lucide-react";
import { signIn } from "@/lib/auth/client";

// Social provider configurations
const socialProviders = {
  google: {
    name: "Google",
    icon: () => (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
  },
  github: {
    name: "GitHub",
    icon: Github,
  },
  linkedin: {
    name: "LinkedIn",
    icon: () => (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
} as const;

type SocialProvider = keyof typeof socialProviders;

interface SocialLoginButtonsProps {
  callbackURL?: string;
  availableProviders?: SocialProvider[];
  loading?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}

export function SocialLoginButtons({
  callbackURL = "/dashboard",
  availableProviders,
  loading: externalLoading = false,
  onLoadingChange,
}: SocialLoginButtonsProps) {
  const [activeProvider, setActiveProvider] = useState<SocialProvider | null>(
    null,
  );

  const handleSocialLogin = async (provider: SocialProvider) => {
    setActiveProvider(provider);
    onLoadingChange?.(true);

    try {
      await signIn.social({
        provider,
        callbackURL,
      });
    } catch {
      toast.error(
        "Something went wrong. Contact support if the issue persists",
      );
    } finally {
      setActiveProvider(null);
      onLoadingChange?.(false);
    }
  };

  // If no providers are specified, try to detect available providers
  // In a real implementation, this would come from server-side configuration
  const providers =
    availableProviders || (Object.keys(socialProviders) as SocialProvider[]);

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {providers.map((provider) => {
        const config = socialProviders[provider];
        const IconComponent = config.icon;

        const isLoading = activeProvider === provider;
        const isDisabled =
          (activeProvider !== null && activeProvider !== provider) ||
          externalLoading;

        return (
          <Button
            key={provider}
            type="button"
            variant="outline"
            disabled={isDisabled}
            onClick={() => handleSocialLogin(provider)}
            className="h-12 w-full border-2 transition-all duration-200 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Connecting...</span>
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <IconComponent className="h-5 w-5" />
                <span className="font-medium">Continue with {config.name}</span>
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
