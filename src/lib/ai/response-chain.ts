import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_BYTES = 32;

function signResponseId(
  responseId: string,
  userId: string,
  conversationId: string,
  secret: string,
) {
  return createHmac("sha256", secret)
    .update(userId)
    .update("\0")
    .update(conversationId)
    .update("\0")
    .update(responseId)
    .digest();
}

export function createResponseHandle(
  responseId: string,
  userId: string,
  conversationId: string,
  secret: string,
) {
  const signature = signResponseId(
    responseId,
    userId,
    conversationId,
    secret,
  ).toString("base64url");
  return `${responseId}.${signature}`;
}

export function readResponseHandle(
  handle: string,
  userId: string,
  conversationId: string,
  secret: string,
) {
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

  const expectedSignature = signResponseId(
    responseId,
    userId,
    conversationId,
    secret,
  );
  return timingSafeEqual(receivedSignature, expectedSignature)
    ? responseId
    : null;
}
