"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Loader2, Monitor, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/auth/client";

type ViewState = "idle" | "error" | "success";

function normalizeDeviceCode(value: string): string {
  const stripped = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  if (stripped.length <= 4) {
    return stripped;
  }

  return `${stripped.slice(0, 4)}-${stripped.slice(4)}`;
}

export function DeviceVerifyForm({
  prefilledCode,
  initialIsSignedIn = false,
}: {
  prefilledCode?: string;
  initialIsSignedIn?: boolean;
}) {
  const { data: session, isPending } = useSession();
  const [code, setCode] = useState(normalizeDeviceCode(prefilledCode ?? ""));
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedCode = useMemo(() => normalizeDeviceCode(code), [code]);
  const isSignedIn = initialIsSignedIn || Boolean(session?.user);
  const canSubmit = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizedCode);

  async function authorizeDevice() {
    if (!canSubmit) {
      setErrorMessage("Please enter a valid 8-character code.");
      setViewState("error");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/v1/device/approve", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          userCode: normalizedCode,
        }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !payload.success) {
        setErrorMessage(
          payload.error?.message ?? "Failed to authorize this device.",
        );
        setViewState("error");
        return;
      }

      setViewState("success");
    } catch {
      setErrorMessage("Network error. Please try again.");
      setViewState("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isPending && !initialIsSignedIn) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (viewState === "success") {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <ShieldCheck className="h-12 w-12 text-green-600" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Device authorized</h2>
            <p className="text-muted-foreground text-sm">
              You can close this tab and return to your terminal.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/developer#cli-sessions">
              Review authorized devices
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isSignedIn) {
    const callbackUrl = `/device${normalizedCode ? `?code=${encodeURIComponent(normalizedCode)}` : ""}`;

    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <Monitor className="text-muted-foreground mx-auto h-10 w-10" />
          <CardTitle>Authorize CLI Device</CardTitle>
          <CardDescription>
            Sign in to your account to approve this command-line session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => {
              window.location.href = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
            }}
          >
            Sign in to continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <Monitor className="text-muted-foreground mx-auto h-10 w-10" />
        <CardTitle>Authorize CLI Device</CardTitle>
        <CardDescription>
          Enter the code shown in your terminal to complete sign-in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {viewState === "error" ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}
        <div className="grid gap-2">
          <Label htmlFor="device-code">Device code</Label>
          <Input
            id="device-code"
            value={normalizedCode}
            onChange={(event) => setCode(normalizeDeviceCode(event.target.value))}
            placeholder="ABCD-EFGH"
            className="text-center font-mono text-lg tracking-[0.2em]"
            maxLength={9}
            autoFocus
          />
        </div>
        <Button
          className="w-full"
          disabled={isSubmitting || !canSubmit}
          onClick={() => {
            void authorizeDevice();
          }}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Authorize
        </Button>
      </CardContent>
    </Card>
  );
}
