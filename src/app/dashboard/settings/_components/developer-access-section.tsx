import { headers } from "next/headers";
import { ApiKeysSection } from "./api-keys-section";
import { CliTokensSection } from "./cli-tokens-section";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { listApiKeys } from "@/lib/api-keys/key-service";
import { listCliTokens } from "@/lib/device-auth/token-service";

export async function DeveloperAccessSection() {
  const requestHeaders = await headers();
  const session = await getAuthSessionFromHeaders(requestHeaders);
  const userId = session?.user?.id;

  const [initialKeys, initialTokens] = await Promise.all([
    userId ? listApiKeys(userId) : Promise.resolve([]),
    userId ? listCliTokens(userId) : Promise.resolve([]),
  ]);

  return (
    <>
      <ApiKeysSection initialKeys={initialKeys} />
      <CliTokensSection initialTokens={initialTokens} />
    </>
  );
}

