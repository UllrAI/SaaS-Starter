import { AuthForm } from "@/components/forms/auth-form";
import { getAvailableSocialProviders } from "@/lib/auth/providers";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Sign In",
  description: "Sign in to your account with magic link",
});

export default function LoginPage() {
  const availableProviders = getAvailableSocialProviders();
  return <AuthForm mode="login" availableProviders={availableProviders} />;
}
