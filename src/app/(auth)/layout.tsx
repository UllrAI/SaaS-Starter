import { Logo } from "@/components/logo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config/constants";
import { BackgroundPattern } from "@/components/ui/background-pattern";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="bg-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <BackgroundPattern />

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      {/* Logo */}
      <div className="absolute top-6 right-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="text-primary h-6 w-6" variant="icon-only" />
          <span className="text-lg font-bold">{APP_NAME}</span>
        </Link>
      </div>

      <div className="relative w-full max-w-md px-6">{children}</div>
    </main>
  );
}
