"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
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
type PendingDeviceInfo = {
  clientName: string | null;
  clientVersion: string | null;
  deviceOs: string | null;
  deviceHostname: string | null;
};
function normalizeDeviceCode(value: string): string {
  const stripped = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
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
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();
  const [code, setCode] = useState(normalizeDeviceCode(prefilledCode ?? ""));
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDevice, setPendingDevice] = useState<PendingDeviceInfo | null>(
    null,
  );
  const normalizedCode = useMemo(() => normalizeDeviceCode(code), [code]);
  const isSignedIn = initialIsSignedIn || Boolean(session?.user);
  const canSubmit = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizedCode);
  async function reviewDevice() {
    if (!canSubmit) {
      setErrorMessage(
        t("device_code_invalid", "Enter a valid 8-character code."),
      );
      setViewState("error");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const response = await fetch(
        `/api/v1/device/pending?user_code=${encodeURIComponent(normalizedCode)}`,
      );
      const payload = (await response.json()) as {
        success: boolean;
        data?: {
          device?: PendingDeviceInfo;
        };
      };
      if (!response.ok || !payload.success || !payload.data?.device) {
        setErrorMessage(
          t(
            "device_review_failed",
            "This device request is invalid or expired.",
          ),
        );
        setViewState("error");
        return;
      }
      setPendingDevice(payload.data.device);
      setViewState("idle");
    } catch {
      setErrorMessage(
        t("device_network_error", "Network error. Please try again."),
      );
      setViewState("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function authorizeDevice() {
    if (!canSubmit || !pendingDevice) {
      await reviewDevice();
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
        error?: {
          message?: string;
        };
      };
      if (!response.ok || !payload.success) {
        setErrorMessage(
          t(
            "device_authorize_failed",
            "We couldn't authorize this device request.",
          ),
        );
        setViewState("error");
        return;
      }
      setViewState("success");
    } catch {
      setErrorMessage(
        t("device_network_error", "Network error. Please try again."),
      );
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
            <h2 className="text-lg font-semibold">
              {t("775932c691fc", "Device authorized")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t(
                "4bbf81106ef2",
                "You can close this tab and return to your terminal.",
              )}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/developer#cli-sessions">
              {t("de18a8adb35a", "Review authorized devices")}
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
          <CardTitle>{t("ed941aa198fd", "Authorize CLI Device")}</CardTitle>
          <CardDescription>
            {t(
              "d13099193545",
              "Sign in to your account to approve this command-line session.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => {
              window.location.href = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
            }}
          >
            {t("88602beb78a9", "Sign in to continue")}
          </Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <Monitor className="text-muted-foreground mx-auto h-10 w-10" />
        <CardTitle>{t("ed941aa198fd", "Authorize CLI Device")}</CardTitle>
        <CardDescription>
          {t(
            "e2ca793f3d45",
            "Enter the code shown in your terminal to complete sign-in.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {viewState === "error" ? (
          <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-lg border px-3 py-2 text-sm">
            {errorMessage}
          </div>
        ) : null}
        <div className="grid gap-2">
          <Label htmlFor="device-code">
            {t("72f8e1cd5634", "Device code")}
          </Label>
          <Input
            id="device-code"
            value={normalizedCode}
            onChange={(event) => {
              setCode(normalizeDeviceCode(event.target.value));
              setPendingDevice(null);
            }}
            placeholder={t("0c5580d504b6", "ABCD-EFGH")}
            className="text-center font-mono text-lg tracking-[0.2em]"
            maxLength={9}
            autoFocus
          />
        </div>
        {pendingDevice ? (
          <div className="border-border bg-muted/40 space-y-3 rounded-lg border p-4">
            <div>
              <p className="font-medium">
                {t("device_review_title", "Review this device")}
              </p>
              <p className="text-muted-foreground text-sm">
                {t(
                  "device_review_warning",
                  "Only continue if these details match the terminal you are signing in from.",
                )}
              </p>
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">
                  {t("device_client_label", "Client")}
                </dt>
                <dd>
                  {pendingDevice.clientName || t("device_unknown", "Unknown")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {t("device_version_label", "Version")}
                </dt>
                <dd>
                  {pendingDevice.clientVersion ||
                    t("device_unknown", "Unknown")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {t("device_hostname_label", "Device")}
                </dt>
                <dd>
                  {pendingDevice.deviceHostname ||
                    t("device_unknown", "Unknown")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {t("device_os_label", "Operating system")}
                </dt>
                <dd>
                  {pendingDevice.deviceOs || t("device_unknown", "Unknown")}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
        <Button
          className="w-full"
          disabled={isSubmitting || !canSubmit}
          onClick={() => {
            void (pendingDevice ? authorizeDevice() : reviewDevice());
          }}
        >
          {t(
            pendingDevice ? "device_confirm_authorize" : "device_review_action",
            pendingDevice
              ? "{expression0} Authorize this device"
              : "{expression0} Review device",
            {
              expression0: isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null,
            },
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
