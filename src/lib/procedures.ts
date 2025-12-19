import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from "next-safe-action";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "./auth/server";
import { APP_NAME } from "@/lib/config/constants";

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
}).use(async ({ next }) => {
  const result = await next();

  return result;
});

export const authActionClient = actionClient
  .use(async ({ next }) => {
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
  })
  .outputSchema(
    z.object({
      success: z.boolean(),
      message: z.string(),
      data: z.any(),
    }),
  );
