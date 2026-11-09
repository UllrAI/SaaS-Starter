import { setTimeout as sleep } from "node:timers/promises";

type DeviceTokenResponse = {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  status?: "authorization_pending" | "slow_down" | "expired";
};

export async function pollDeviceToken(
  baseUrl: string,
  deviceCode: string,
  interval: number,
  signal: AbortSignal,
) {
  try {
    for (;;) {
      await sleep(interval * 1000, undefined, { signal });
      const response = await fetch(`${baseUrl}/api/v1/device/token`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deviceCode }),
        signal,
      });
      const payload = (await response.json()) as {
        success: boolean;
        data?: DeviceTokenResponse;
        error?: { message: string };
      };

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(
          payload.error?.message ?? "Failed to complete device login.",
        );
      }
      const { accessToken, refreshToken, expiresIn, status } = payload.data;
      if (accessToken && refreshToken)
        return { accessToken, refreshToken, expiresIn };
      if (status === "expired") {
        throw new Error("Device code expired. Please try again.");
      }
      if (status === "slow_down") interval = Math.min(interval + 1, 30);
    }
  } catch (error) {
    if (signal.aborted)
      throw new Error("Authorization timed out. Please try again.");
    throw error;
  }
}
