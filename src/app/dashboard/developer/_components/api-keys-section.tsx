"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, Plus, ShieldOff } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiKeyPublic } from "@/lib/machine-auth/types";
export function ApiKeysSection({
  initialKeys,
}: {
  initialKeys: ApiKeyPublic[];
}) {
  const { t } = useTranslation();
  const [keys, setKeys] = useState(initialKeys);
  const refreshKeys = useCallback(async () => {
    try {
      const response = await fetch("/api/api-keys");
      if (!response.ok) {
        throw new Error("Failed to fetch API keys.");
      }
      const data = (await response.json()) as {
        keys: ApiKeyPublic[];
      };
      setKeys(data.keys);
    } catch {
      toast.error(
        t("developer_api_keys_load_error", "Failed to load API keys."),
      );
    }
  }, [t]);
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>{t("808cf1a5b1ad", "API Keys")}</CardTitle>
            <CardDescription>
              {t(
                "6f34c9c7057b",
                "Create long-lived keys for servers, CI jobs, and other non-interactive API clients.",
              )}
            </CardDescription>
          </div>
          <CreateApiKeyDialog onCreated={refreshKeys} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {keys.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center">
            <KeyRound className="text-muted-foreground h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              {t(
                "61ca6f8370af",
                "No API keys yet. Create one when you need server-to-server access.",
              )}
            </p>
          </div>
        ) : (
          keys.map((apiKey) => (
            <ApiKeyRow
              key={apiKey.id}
              apiKey={apiKey}
              onRevoked={refreshKeys}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
function ApiKeyRow({
  apiKey,
  onRevoked,
}: {
  apiKey: ApiKeyPublic;
  onRevoked: () => void;
}) {
  const { t } = useTranslation();
  const [isRevoking, setIsRevoking] = useState(false);
  async function handleRevoke() {
    setIsRevoking(true);
    try {
      const response = await fetch(`/api/api-keys/${apiKey.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to revoke API key.");
      }
      toast.success(t("developer_api_key_revoke_success", "API key revoked."));
      await onRevoked();
    } catch {
      toast.error(
        t("developer_api_key_revoke_error", "Failed to revoke API key."),
      );
    } finally {
      setIsRevoking(false);
    }
  }
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium" translate="no">
            {apiKey.name}
          </p>
          <Badge variant={apiKey.isActive ? "secondary" : "outline"}>
            {apiKey.isActive ? (
              <>{t("4d6a56ae284d", "Active")}</>
            ) : (
              <>{t("50b644b2415a", "Revoked")}</>
            )}
          </Badge>
        </div>
        <p className="text-muted-foreground font-mono text-xs" translate="no">
          {apiKey.keyPrefix}...{apiKey.lastFourChars}
        </p>
        <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
          <span>
            {t("cdba25e3ba82", "Rate limit <span0></span0>/min", {
              span0: () => <span translate="no">{apiKey.rateLimit}</span>,
            })}
          </span>
          <span>
            {t("30e9afa24d8d", "Created <span0></span0>", {
              span0: () => (
                <span translate="no">
                  {new Date(apiKey.createdAt).toLocaleDateString()}
                </span>
              ),
            })}
          </span>
          {apiKey.lastUsedAt ? (
            <span>
              {t("e7bdd97d16d9", "Last used <span0></span0>", {
                span0: () => (
                  <span translate="no">
                    {new Date(apiKey.lastUsedAt!).toLocaleDateString()}
                  </span>
                ),
              })}
            </span>
          ) : (
            <span>{t("6c7815348a0f", "Never used")}</span>
          )}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={isRevoking || !apiKey.isActive}
        onClick={() => {
          void handleRevoke();
        }}
      >
        {t("20fb1816e98e", "{expression0} Revoke", {
          expression0: isRevoking ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShieldOff className="mr-2 h-4 w-4" />
          ),
        })}
      </Button>
    </div>
  );
}
function CreateApiKeyDialog({ onCreated }: { onCreated: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  function resetState() {
    setName("");
    setCreatedKey(null);
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetState();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Plus className="mr-2 h-4 w-4" />
          {t("026500c40ae6", "Create Key")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        {createdKey ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("d4a9b038617b", "API Key Created")}</DialogTitle>
              <DialogDescription>
                {t(
                  "ce68b6e9b6ef",
                  "Copy this key now. It will not be shown again.",
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted flex items-center gap-2 rounded-lg border p-3">
              <code className="min-w-0 flex-1 text-sm break-all" translate="no">
                {createdKey}
              </code>
              <CopyButton textToCopy={createdKey} />
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setOpen(false);
                }}
              >
                {t("69a562e2e6ee", "Done")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("555efac3a16b", "Create API Key")}</DialogTitle>
              <DialogDescription>
                {t(
                  "cdd513394b6d",
                  "Use a descriptive name so you can identify this key later.",
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <Label htmlFor="api-key-name">{t("0f3cfdaa1842", "Name")}</Label>
              <Input
                id="api-key-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("52f00a1d717f", "Production server")}
              />
            </div>
            <DialogFooter>
              <Button
                disabled={isCreating || !name.trim()}
                onClick={async () => {
                  setIsCreating(true);
                  try {
                    const response = await fetch("/api/api-keys", {
                      method: "POST",
                      headers: {
                        "content-type": "application/json",
                      },
                      body: JSON.stringify({
                        name: name.trim(),
                      }),
                    });
                    if (!response.ok) {
                      throw new Error("Failed to create API key.");
                    }
                    const data = (await response.json()) as {
                      rawKey: string;
                    };
                    setCreatedKey(data.rawKey);
                    toast.success(
                      t("developer_api_key_create_success", "API key created."),
                    );
                    await onCreated();
                  } catch {
                    toast.error(
                      t(
                        "developer_api_key_create_error",
                        "Failed to create API key.",
                      ),
                    );
                  } finally {
                    setIsCreating(false);
                  }
                }}
              >
                {t("ee4a496d98ec", "{expression0} Create Key", {
                  expression0: isCreating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null,
                })}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
