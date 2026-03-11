import { headers } from "next/headers";
import { ApiKeysSection } from "./api-keys-section";
import { CliTokensSection } from "./cli-tokens-section";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { listApiKeys } from "@/lib/api-keys/key-service";
import { listCliTokens } from "@/lib/device-auth/token-service";

export async function DeveloperAccessSections() {
  const requestHeaders = await headers();
  const session = await getAuthSessionFromHeaders(requestHeaders);
  const userId = session?.user?.id;

  const [initialKeys, initialTokens] = await Promise.all([
    userId ? listApiKeys(userId) : Promise.resolve([]),
    userId ? listCliTokens(userId) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <section id="api-keys" className="scroll-mt-20">
        <ApiKeysSection initialKeys={initialKeys} />
      </section>
      <section id="cli-sessions" className="scroll-mt-20">
        <CliTokensSection initialTokens={initialTokens} />
      </section>
    </div>
  );
}
