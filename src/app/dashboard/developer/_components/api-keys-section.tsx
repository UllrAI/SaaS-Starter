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
      toast.error(t("developer_api_keys_load_error"));
    }
  }, [t]);
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>{t("device_api_keys")}</CardTitle>
            <CardDescription>
              {t("device_create_long_lived_keys_servers_ci")}
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
              {t("device_no_api_keys_yet_create_one")}
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
      toast.success(t("developer_api_key_revoke_success"));
      await onRevoked();
    } catch {
      toast.error(t("developer_api_key_revoke_error"));
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
              <>{t("device_active")}</>
            ) : (
              <>{t("device_revoked")}</>
            )}
          </Badge>
        </div>
        <p className="text-muted-foreground font-mono text-xs" translate="no">
          {apiKey.keyPrefix}...{apiKey.lastFourChars}
        </p>
        <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
          <span>
            {t.rich("device_rate_limit_min", {
              span0: () => <span translate="no">{apiKey.rateLimit}</span>,
            })}
          </span>
          <span>
            {t.rich("device_created", {
              span0: () => (
                <span translate="no">
                  {new Date(apiKey.createdAt).toLocaleDateString()}
                </span>
              ),
            })}
          </span>
          {apiKey.lastUsedAt ? (
            <span>
              {t.rich("device_last_used", {
                span0: () => (
                  <span translate="no">
                    {new Date(apiKey.lastUsedAt!).toLocaleDateString()}
                  </span>
                ),
              })}
            </span>
          ) : (
            <span>{t("device_never_used")}</span>
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
        {t.rich("device_revoke", {
          expression0: () =>
            isRevoking ? (
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
          {t("device_create_key")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        {createdKey ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("device_api_key_created")}</DialogTitle>
              <DialogDescription>
                {t("device_copy_key_now_it_will_not")}
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
                {t("device_done")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("device_create_api_key")}</DialogTitle>
              <DialogDescription>
                {t("device_use_descriptive_name_so_you_can")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <Label htmlFor="api-key-name">{t("device_name")}</Label>
              <Input
                id="api-key-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("device_production_server")}
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
                    toast.success(t("developer_api_key_create_success"));
                    await onCreated();
                  } catch {
                    toast.error(t("developer_api_key_create_error"));
                  } finally {
                    setIsCreating(false);
                  }
                }}
              >
                {t.rich("device_create_key_api", {
                  expression0: () =>
                    isCreating ? (
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
