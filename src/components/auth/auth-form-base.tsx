"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LocalizedLink as Link } from "@/components/localized-link";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import type { SocialProvider } from "@/lib/auth/providers";
import { ReactNode } from "react";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import type { ResolvedAuthFeedback } from "@/lib/auth/feedback";
import { AuthFeedbackAlert } from "@/components/auth/auth-feedback-alert";
type AuthPendingAction = "magic-link" | "social" | null;
interface AuthFormField<T extends FieldValues> {
  name: Path<T>;
  label: ReactNode;
  placeholder: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  type?: string;
}
interface AuthFormConfig {
  title: ReactNode;
  description: ReactNode;
  submitButtonText: ReactNode;
  magicLinkLoadingText: ReactNode;
  submitIcon: React.ComponentType<{
    className?: string;
  }>;
  alternativeActionText: ReactNode;
  alternativeActionLink: ReactNode;
  showTerms?: boolean;
  callbackURL: string;
  newUserCallbackURL?: string;
}
interface AuthFormBaseProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => Promise<void>;
  pendingAction: AuthPendingAction;
  setPendingAction: (action: AuthPendingAction) => void;
  config: AuthFormConfig;
  fields: AuthFormField<T>[];
  availableProviders?: SocialProvider[];
  feedback?: ResolvedAuthFeedback | null;
  showMagicLink?: boolean;
}
export function AuthFormBase<T extends FieldValues>({
  form,
  onSubmit,
  pendingAction,
  setPendingAction,
  config,
  fields,
  availableProviders,
  feedback,
  showMagicLink = true,
}: AuthFormBaseProps<T>) {
  const { t } = useTranslation();
  const isPending = pendingAction !== null;
  const isMagicLinkPending = pendingAction === "magic-link";
  const handleSubmit = async (data: T) => {
    try {
      setPendingAction("magic-link");
      await onSubmit(data);
    } catch {
      toast.error(t("auth_unexpected_error"));
      setPendingAction(null);
    }
  };
  return (
    <Card className="bg-background w-full border-2">
      <CardHeader className="space-y-4">
        <div className="space-y-2 text-center">
          <CardTitle className="text-foreground text-2xl font-bold md:text-3xl">
            {config.title}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm md:text-base">
            {config.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <AuthFeedbackAlert feedback={feedback ?? null} />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Social Login Buttons */}
            {availableProviders && availableProviders.length > 0 && (
              <>
                <SocialLoginButtons
                  callbackURL={config.callbackURL}
                  newUserCallbackURL={config.newUserCallbackURL}
                  availableProviders={availableProviders}
                  loading={isPending}
                  onLoadingChange={(loading) => {
                    setPendingAction(loading ? "social" : null);
                  }}
                />

                {showMagicLink && (
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="border-border w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-background text-muted-foreground px-3 font-medium">
                        {t("auth_continue_magic_link")}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {showMagicLink &&
              fields.map((field) => {
                const IconComponent = field.icon;
                return (
                  <FormField
                    key={field.name}
                    control={form.control}
                    name={field.name}
                    render={({ field: formField }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-foreground text-sm font-medium">
                          {field.label}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IconComponent className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                              placeholder={field.placeholder}
                              type={field.type || "text"}
                              {...formField}
                              disabled={isPending}
                              className="focus:border-primary h-12 border-2 pl-10"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              })}

            {showMagicLink && (
              <Button
                type="submit"
                disabled={isPending}
                className="text-primary-foreground h-12 w-full cursor-pointer font-medium"
              >
                {isMagicLinkPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{config.magicLinkLoadingText}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <config.submitIcon className="h-4 w-4" />
                    <span>{config.submitButtonText}</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            )}

            {/* Alternative Action Link */}
            <div className="pt-4 text-center">
              <p className="text-muted-foreground text-sm">
                {config.alternativeActionText} {config.alternativeActionLink}
              </p>
            </div>
          </form>
        </Form>

        {/* Terms and Privacy */}
        {config.showTerms && (
          <div className="border-border/50 border-t pt-4">
            <p className="text-muted-foreground/70 text-center text-xs leading-relaxed">
              {t.rich("auth_creating_account_you_agree_terms_service", {
                Link0: (chunks) => (
                  <Link
                    href="/terms"
                    className="text-primary hover:text-primary/80 cursor-pointer font-medium underline-offset-4 transition-colors hover:underline"
                  >
                    {chunks}
                  </Link>
                ),
                Link1: (chunks) => (
                  <Link
                    href="/privacy"
                    className="text-primary hover:text-primary/80 cursor-pointer font-medium underline-offset-4 transition-colors hover:underline"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
