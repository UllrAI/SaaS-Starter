import { useTranslation } from "@/lib/i18n/translation/client";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
interface LinkSentCardProps {
  title: string;
  description: React.ReactNode;
  retryHref: string;
}
export function LinkSentCard({
  title,
  description,
  retryHref,
}: LinkSentCardProps) {
  const { t } = useTranslation();
  return (
    <Card className="bg-background w-full border-2">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center border bg-green-50">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <CardTitle className="text-xl font-semibold tracking-tight">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-6">
        <div className="text-muted-foreground text-center text-sm leading-relaxed">
          {description}
        </div>
      </CardContent>

      <CardFooter className="flex-col space-y-0 border-t">
        <p className="text-muted-foreground text-center text-xs leading-relaxed">
          {t.rich("auth_didnt_receive_send_again_check_spam", {
            Link0: (chunks) => (
              <Link
                href={retryHref}
                className="font-medium underline-offset-2 hover:underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </CardFooter>
    </Card>
  );
}
