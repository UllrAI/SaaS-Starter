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
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary rounded-lg p-2">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <CardTitle>Developer Access</CardTitle>
            <CardDescription>
              Manage API keys, CLI sessions, and agent-friendly access from one
              dedicated page.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Open the developer access workspace to review API credentials and
          authorized command-line devices.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/developer">
            Open developer access
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
