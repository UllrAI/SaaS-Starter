"use client";

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
  const [keys, setKeys] = useState(initialKeys);

  const refreshKeys = useCallback(async () => {
    try {
      const response = await fetch("/api/api-keys");
      if (!response.ok) {
        throw new Error("Failed to fetch API keys.");
      }

      const data = (await response.json()) as { keys: ApiKeyPublic[] };
      setKeys(data.keys);
    } catch {
      toast.error(<>Failed to load API keys.</>);
    }
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Create long-lived keys for servers, CI jobs, and other
              non-interactive API clients.
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
              No API keys yet. Create one when you need server-to-server access.
            </p>
          </div>
        ) : (
          keys.map((apiKey) => (
            <ApiKeyRow key={apiKey.id} apiKey={apiKey} onRevoked={refreshKeys} />
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

      toast.success(<>API key revoked.</>);
      await onRevoked();
    } catch {
      toast.error(<>Failed to revoke API key.</>);
    } finally {
      setIsRevoking(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium" data-lingo-skip>
            {apiKey.name}
          </p>
          <Badge variant={apiKey.isActive ? "secondary" : "outline"}>
            {apiKey.isActive ? <>Active</> : <>Revoked</>}
          </Badge>
        </div>
        <p className="text-muted-foreground font-mono text-xs" data-lingo-skip>
          {apiKey.keyPrefix}...{apiKey.lastFourChars}
        </p>
        <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
          <span>
            Rate limit <span data-lingo-skip>{apiKey.rateLimit}</span>/min
          </span>
          <span>
            Created{" "}
            <span data-lingo-skip>
              {new Date(apiKey.createdAt).toLocaleDateString()}
            </span>
          </span>
          {apiKey.lastUsedAt ? (
            <span>
              Last used{" "}
              <span data-lingo-skip>
                {new Date(apiKey.lastUsedAt).toLocaleDateString()}
              </span>
            </span>
          ) : (
            <span>Never used</span>
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
        {isRevoking ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ShieldOff className="mr-2 h-4 w-4" />
        )}
        Revoke
      </Button>
    </div>
  );
}

function CreateApiKeyDialog({ onCreated }: { onCreated: () => void }) {
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
          Create Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        {createdKey ? (
          <>
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription>
                Copy this key now. It will not be shown again.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 rounded-lg border bg-muted p-3">
              <code className="min-w-0 flex-1 break-all text-sm" data-lingo-skip>
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
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Use a descriptive name so you can identify this key later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <Label htmlFor="api-key-name">Name</Label>
              <Input
                id="api-key-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Production server"
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

                    const data = (await response.json()) as { rawKey: string };
                    setCreatedKey(data.rawKey);
                    toast.success(<>API key created.</>);
                    await onCreated();
                  } catch {
                    toast.error(<>Failed to create API key.</>);
                  } finally {
                    setIsCreating(false);
                  }
                }}
              >
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Key
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
