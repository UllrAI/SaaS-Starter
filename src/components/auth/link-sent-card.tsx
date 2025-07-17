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
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="bg-muted/30 w-full max-w-md shadow-md backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
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
            Didn&apos;t receive?{" "}
            <Link
              href={retryHref}
              className="font-medium underline-offset-2 hover:underline"
            >
              Send again
            </Link>{" "}
            or check your spam folder.
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
