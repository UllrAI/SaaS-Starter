"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { LaptopMinimal, Loader2, ShieldOff, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CliTokenPublic } from "@/lib/machine-auth/types";

export function CliTokensSection({
  initialTokens,
}: {
  initialTokens: CliTokenPublic[];
}) {
  const [tokens, setTokens] = useState(initialTokens);

  const refreshTokens = useCallback(async () => {
    try {
      const response = await fetch("/api/cli-tokens");
      if (!response.ok) {
        throw new Error("Failed to fetch CLI sessions.");
      }

      const data = (await response.json()) as { tokens: CliTokenPublic[] };
      setTokens(data.tokens);
    } catch {
      toast.error(<>Failed to load CLI sessions.</>);
    }
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>CLI Sessions</CardTitle>
        <CardDescription>
          Review active command-line sessions created via browser login and
          revoke any device instantly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tokens.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center">
            <Terminal className="text-muted-foreground h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              No CLI sessions yet. Run{" "}
              <code className="rounded bg-muted px-1 py-0.5" data-lingo-skip>
                pnpm saas-cli -- auth login
              </code>{" "}
              to authorize a device.
            </p>
          </div>
        ) : (
          tokens.map((token) => (
            <CliTokenRow
              key={token.id}
              token={token}
              onRevoked={refreshTokens}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CliTokenRow({
  token,
  onRevoked,
}: {
  token: CliTokenPublic;
  onRevoked: () => void;
}) {
  const [isRevoking, setIsRevoking] = useState(false);
  const isExpired = new Date(token.expiresAt).getTime() < Date.now();

  async function handleRevoke() {
    setIsRevoking(true);

    try {
      const response = await fetch(`/api/cli-tokens/${token.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to revoke CLI session.");
      }

      toast.success(<>CLI session revoked.</>);
      await onRevoked();
    } catch {
      toast.error(<>Failed to revoke CLI session.</>);
    } finally {
      setIsRevoking(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <LaptopMinimal className="text-muted-foreground h-4 w-4" />
          <p className="truncate text-sm font-medium" data-lingo-skip>
            {token.name}
          </p>
          <Badge variant={!token.isActive || isExpired ? "outline" : "secondary"}>
            {!token.isActive ? <>Revoked</> : isExpired ? <>Expired</> : <>Active</>}
          </Badge>
        </div>
        <p className="text-muted-foreground font-mono text-xs" data-lingo-skip>
          {token.tokenPrefix}...{token.lastFourChars}
        </p>
        <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
          {token.deviceOs ? <span data-lingo-skip>{token.deviceOs}</span> : null}
          {token.deviceHostname ? (
            <span data-lingo-skip>{token.deviceHostname}</span>
          ) : null}
          {token.cliVersion ? <span data-lingo-skip>{token.cliVersion}</span> : null}
          <span>
            Created{" "}
            <span data-lingo-skip>
              {new Date(token.createdAt).toLocaleDateString()}
            </span>
          </span>
          {token.lastUsedAt ? (
            <span>
              Last used{" "}
              <span data-lingo-skip>
                {new Date(token.lastUsedAt).toLocaleDateString()}
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
        disabled={isRevoking || !token.isActive}
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
