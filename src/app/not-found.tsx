import { Home, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackgroundPattern } from "@/components/ui/background-pattern";

export default function NotFound() {
  return (
    <main className="bg-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <BackgroundPattern />

      <div className="relative mx-auto max-w-2xl px-6 text-center">
        {/* Status Badge */}
        <div className="border-border bg-background/50 mb-8 inline-flex items-center rounded-full border px-3 py-1 text-sm backdrop-blur-sm">
          <Sparkles className="text-primary mr-2 h-3 w-3" />
          <span className="text-muted-foreground">Error 404</span>
        </div>

        {/* Large 404 Display */}
        <div className="mb-6">
          <h1
            className="text-primary/20 text-8xl font-bold tracking-tight select-none sm:text-9xl"
            data-lingo-skip
          >
            404
          </h1>
        </div>

        {/* Main Message */}
        <div className="mb-8 space-y-4">
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            Page Not Found
          </h2>
          <p className="text-muted-foreground mx-auto max-w-lg text-lg leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Let&apos;s get you back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="min-w-[160px]">
            <Link href="/dashboard" prefetch={true}>
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="min-w-[160px]">
            <Link href="/" prefetch={true}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-muted-foreground mt-12 text-sm">
          <p>
            Need help?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
