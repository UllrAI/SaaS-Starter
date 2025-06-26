import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from "next-safe-action";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "./auth/server";
import { APP_NAME } from "@/lib/config/constants";
import {
  BaseApiResponseSchema,
  createTypedOutputSchema,
} from "./types/api-response";

const actionClient = createSafeActionClient({
  handleServerError(e) {
    console.error("Action error:", e.message);

    if (e instanceof Error) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
    });
  },
}).use(async ({ next, clientInput, metadata }) => {
  const startTime = performance.now();

  const result = await next();

  const endTime = performance.now();

  console.log(`Server action ${metadata.actionName} 
    with input: 
    ${clientInput} took ${endTime - startTime}ms 
    and resulted with:
     ${result}`);

  return result;
});

// Base authenticated action client without fixed output schema
// Use createTypedOutputSchema() for specific actions with known response types
export const authActionClient = actionClient.use(async ({ next }) => {
  const res = await auth.api.getSession({
    headers: await headers(),
  });

  if (!res || !res.session || !res.user) {
    throw new Error("You are not authorized to perform this action");
  }
  const extraUtils = {
    authenticatedUrl: "/dashboard",
    unauthenticatedUrl: "/login",
    appName: APP_NAME,
  };
  return next({
    ctx: {
      user: res.user,
      session: res.session,
      utils: extraUtils,
    },
  });
});

// Type-safe authenticated action client with base response schema
// For actions that don't need typed data response
export const authActionClientWithBaseResponse = authActionClient.outputSchema(
  BaseApiResponseSchema,
);

// Helper function to create type-safe authenticated action clients with specific response schemas
export function createTypedAuthActionClient<T extends z.ZodTypeAny>(
  dataSchema: T,
) {
  return authActionClient.outputSchema(createTypedOutputSchema(dataSchema));
}
