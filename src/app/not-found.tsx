import { useTranslation } from "@/lib/i18n/translation/client";
import { Home, ArrowLeft, Sparkles } from "lucide-react";
import { LocalizedLink as Link } from "@/components/localized-link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackgroundPattern } from "@/components/ui/background-pattern";
export default function NotFound() {
  const { t } = useTranslation();
  return (
    <main className="bg-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <BackgroundPattern />

      <div className="relative mx-auto w-full max-w-2xl px-6 text-center">
        {/* Status Badge */}
        <Badge className="border-border bg-background/50 mb-8 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
          <Sparkles className="text-muted-foreground mr-2 h-3 w-3" />
          <span className="text-muted-foreground font-mono">
            {t("fecf06fdc1d1", "ERROR_404")}
          </span>
        </Badge>

        {/* Large 404 Display */}
        <div className="mb-6">
          <h1
            className="text-primary/20 text-8xl font-bold tracking-tight select-none sm:text-9xl"
            translate="no"
          >
            404
          </h1>
        </div>

        {/* Main Message */}
        <div className="mb-8 space-y-4">
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            {t("20cd73fb1bec", "Page Not Found")}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-lg text-lg leading-relaxed">
            {t(
              "b1c2f0f90a10",
              "The page you're looking for doesn't exist or has been moved. Let's get you back on track.",
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="min-w-[160px]">
            <Link href="/dashboard" prefetch={true}>
              <Home className="mr-2 h-4 w-4" />
              {t("3f29f12409bd", "Go to Dashboard")}
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="min-w-[160px]">
            <Link href="/" prefetch={true}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("12b611abe60d", "Back to Home")}
            </Link>
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-muted-foreground mt-12 text-sm">
          <p>
            {t(
              "92737d402302",
              "Need help? <Link0>Contact our support team </Link0>",
              {
                Link0: (chunks) => (
                  <Link
                    href="/contact"
                    className="text-primary hover:underline"
                  >
                    {chunks}
                  </Link>
                ),
              },
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
