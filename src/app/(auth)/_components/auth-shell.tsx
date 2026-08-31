import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/logo";
import { LocalizedLink as Link } from "@/components/localized-link";
import { CompactContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config/constants";
import { useTranslation } from "@/lib/i18n/translation/client";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <main className="bg-background relative flex min-h-screen flex-col items-center justify-center">
      <div className="absolute top-6 left-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("auth_back_home")}
          </Link>
        </Button>
      </div>
      <div className="absolute top-6 right-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="text-primary h-6 w-6" variant="icon-only" />
          <span className="text-lg font-bold">{APP_NAME}</span>
        </Link>
      </div>
      <CompactContainer className="relative">{children}</CompactContainer>
    </main>
  );
}
