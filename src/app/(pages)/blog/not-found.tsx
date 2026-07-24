import { useTranslation } from "@/lib/i18n/translation/client";
import { Home, ArrowLeft, Sparkles } from "lucide-react";
import { LocalizedLink as Link } from "@/components/localized-link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackgroundPattern } from "@/components/ui/background-pattern";
import { ReadingContainer } from "@/components/layout/page-container";
export default function PagesNotFound() {
  const { t } = useTranslation();
  return (
    <div className="bg-background relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden py-16">
      <BackgroundPattern />

      <ReadingContainer className="relative text-center">
        {/* Status Badge */}
        <Badge className="border-border bg-background/50 mb-8 inline-flex items-center border px-3 py-1 text-sm backdrop-blur-sm">
          <Sparkles className="text-muted-foreground mr-2 h-3 w-3" />
          <span className="text-muted-foreground font-mono">
            {t("14845f8bee6d", "ERROR_404")}
          </span>
        </Badge>

        {/* Large 404 Display */}
        <div className="mb-6">
          <h1
            className="text-primary/20 text-6xl font-bold tracking-tight select-none sm:text-7xl"
            translate="no"
          >
            404
          </h1>
        </div>

        {/* Main Message */}
        <div className="mb-8 space-y-4">
          <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            {t("60477e09907e", "Page Not Found")}
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            {t(
              "26bb01a0c1db",
              "The page you're looking for doesn't exist or has been moved. Let's get you back on track.",
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="min-w-[160px]">
            <Link href="/blog" prefetch={true}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("b8f4252b89e2", "Back to Blog")}
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="min-w-[160px]">
            <Link href="/" prefetch={true}>
              <Home className="mr-2 h-4 w-4" />
              {t("e79407a4caeb", "Back to Home")}
            </Link>
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-muted-foreground mt-8 text-sm">
          <p>
            {t(
              "65533dcf4703",
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
      </ReadingContainer>
    </div>
  );
}
