import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import env from "@/env";

const SIGNATURE_BYTES = 32;

function signResponseId(responseId: string, userId: string) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(userId)
    .update("\0")
    .update(responseId)
    .digest();
}

export function createResponseHandle(responseId: string, userId: string) {
  const signature = signResponseId(responseId, userId).toString("base64url");
  return `${responseId}.${signature}`;
}

export function readResponseHandle(handle: string, userId: string) {
  const separatorIndex = handle.lastIndexOf(".");
  if (separatorIndex <= 0) {
    return null;
  }

  const responseId = handle.slice(0, separatorIndex);
  const encodedSignature = handle.slice(separatorIndex + 1);

  let receivedSignature: Buffer;
  try {
    receivedSignature = Buffer.from(encodedSignature, "base64url");
  } catch {
    return null;
  }

  if (receivedSignature.length !== SIGNATURE_BYTES) {
    return null;
  }

  const expectedSignature = signResponseId(responseId, userId);
  return timingSafeEqual(receivedSignature, expectedSignature)
    ? responseId
    : null;
}
