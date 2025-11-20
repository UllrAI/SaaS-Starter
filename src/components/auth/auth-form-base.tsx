"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { getAvailableSocialProviders } from "@/lib/auth/providers";
import { ReactNode } from "react";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";

interface AuthFormField<T extends FieldValues> {
  name: Path<T>;
  label: ReactNode;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  type?: string;
}

interface AuthFormConfig {
  title: ReactNode;
  description: ReactNode;
  badgeText: ReactNode;
  submitButtonText: ReactNode;
  loadingText: ReactNode;
  submitIcon: React.ComponentType<{ className?: string }>;
  alternativeActionText: ReactNode;
  alternativeActionLink: ReactNode;
  showTerms?: boolean;
  callbackURL: string;
}

interface AuthFormBaseProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  config: AuthFormConfig;
  fields: AuthFormField<T>[];
  availableProviders?: ReturnType<typeof getAvailableSocialProviders>;
}

export function AuthFormBase<T extends FieldValues>({
  form,
  onSubmit,
  loading,
  setLoading,
  config,
  fields,
  availableProviders,
}: AuthFormBaseProps<T>) {
  const handleSubmit = async (data: T) => {
    try {
      setLoading(true);
      await onSubmit(data);
    } catch {
      toast.error(
        "Something went wrong. Contact support if the issue persists",
      );
      setLoading(false);
    }
  };

  return (
    <Card className="bg-background/80 max-w-md border-2 shadow-lg backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-2">
        {/* Welcome Badge */}
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary border-primary/20"
          >
            <Sparkles className="mr-1 h-3 w-3" />
            {config.badgeText}
          </Badge>
        </div>

        <div className="space-y-2 text-center">
          <CardTitle className="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
            {config.title}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm md:text-base">
            {config.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
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
                  availableProviders={availableProviders}
                  loading={loading}
                  onLoadingChange={setLoading}
                />

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="border-border w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background text-muted-foreground px-3 font-medium">
                      Or continue with magic link
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Dynamic Form Fields */}
            {fields.map((field) => {
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
                            disabled={loading}
                            className="focus:border-primary/50 h-12 border-2 pl-10 shadow-sm transition-all focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground h-12 w-full cursor-pointer bg-gradient-to-r font-medium shadow transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{config.loadingText}</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <config.submitIcon className="h-4 w-4" />
                  <span>{config.submitButtonText}</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>

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
              By creating an account, you agree to our{" "}
              <Link
                href="/terms"
                className="text-primary hover:text-primary/80 cursor-pointer font-medium underline-offset-4 transition-colors hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-primary hover:text-primary/80 cursor-pointer font-medium underline-offset-4 transition-colors hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
