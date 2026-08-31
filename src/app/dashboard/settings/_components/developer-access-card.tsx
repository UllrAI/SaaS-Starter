import { useTranslation } from "@/lib/i18n/translation/client";
import Link from "next/link";
import { ArrowRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
export function DeveloperAccessCard() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <CardTitle>{t("settings_developer_access")}</CardTitle>
            <CardDescription>
              {t("settings_manage_api_keys_cli_sessions_agent")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {t("settings_developer_access_workspace")}
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/developer">
            {t("settings_open_developer_access")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
