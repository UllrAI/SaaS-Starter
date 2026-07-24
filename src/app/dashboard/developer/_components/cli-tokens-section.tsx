"use client";

import { useTranslation } from "@/lib/i18n/translation/client";
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
  const { t } = useTranslation();
  const [tokens, setTokens] = useState(initialTokens);
  const refreshTokens = useCallback(async () => {
    try {
      const response = await fetch("/api/cli-tokens");
      if (!response.ok) {
        throw new Error("Failed to fetch CLI sessions.");
      }
      const data = (await response.json()) as {
        tokens: CliTokenPublic[];
      };
      setTokens(data.tokens);
    } catch {
      toast.error(<>Failed to load CLI sessions.</>);
    }
  }, []);
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("c110440cd580", "CLI Sessions")}</CardTitle>
        <CardDescription>
          {t(
            "b7ce584cbc83",
            "Review active command-line sessions created via browser login and revoke any device instantly.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tokens.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center">
            <Terminal className="text-muted-foreground h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              {t(
                "8a6958ceb6b2",
                "No CLI sessions yet. Run <code0></code0> to authorize a device.",
                {
                  code0: () => (
                    <code
                      className="bg-muted rounded px-1 py-0.5"
                      translate="no"
                    >
                      pnpm saas-cli -- auth login
                    </code>
                  ),
                },
              )}
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
  const { t } = useTranslation();
  const [isRevoking, setIsRevoking] = useState(false);
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
          <p className="truncate text-sm font-medium" translate="no">
            {token.name}
          </p>
          <Badge
            variant={
              !token.isActive || token.isExpired ? "outline" : "secondary"
            }
          >
            {!token.isActive ? (
              <>{t("d62ae0790082", "Revoked")}</>
            ) : token.isExpired ? (
              <>{t("34777eb178ac", "Expired")}</>
            ) : (
              <>{t("de73a11c661e", "Active")}</>
            )}
          </Badge>
        </div>
        <p className="text-muted-foreground font-mono text-xs" translate="no">
          {token.tokenPrefix}...{token.lastFourChars}
        </p>
        <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
          {token.deviceOs ? <span translate="no">{token.deviceOs}</span> : null}
          {token.deviceHostname ? (
            <span translate="no">{token.deviceHostname}</span>
          ) : null}
          {token.cliVersion ? (
            <span translate="no">{token.cliVersion}</span>
          ) : null}
          <span>
            {t("20c6ef263585", "Created <span0></span0>", {
              span0: () => (
                <span translate="no">
                  {new Date(token.createdAt).toLocaleDateString()}
                </span>
              ),
            })}
          </span>
          {token.lastUsedAt ? (
            <span>
              {t("fa54e288859b", "Last used <span0></span0>", {
                span0: () => (
                  <span translate="no">
                    {new Date(token.lastUsedAt!).toLocaleDateString()}
                  </span>
                ),
              })}
            </span>
          ) : (
            <span>{t("9820b8925dca", "Never used")}</span>
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
        {t("7b54ec5999fa", "{expression0} Revoke", {
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
