import { headers } from "next/headers";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { DeviceVerifyForm } from "./_components/device-verify-form";

interface DevicePageProps {
  searchParams?: Promise<{
    code?: string | string[];
  }>;
}

export default async function DevicePage({ searchParams }: DevicePageProps) {
  const session = await getAuthSessionFromHeaders(await headers());
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rawCode = resolvedSearchParams.code;
  const prefilledCode = Array.isArray(rawCode) ? rawCode[0] : rawCode;

  return (
    <DeviceVerifyForm
      prefilledCode={prefilledCode}
      initialIsSignedIn={Boolean(session?.user)}
    />
  );
}
