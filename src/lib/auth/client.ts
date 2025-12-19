import env from "@/env";
import { createAuthClient } from "better-auth/react";
import {
  magicLinkClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import type { auth } from "./server";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  plugins: [magicLinkClient(), inferAdditionalFields<typeof auth>()],
});

export const {
  signIn,
  signOut,
  signUp,
  revokeSession,
  updateUser,
  getSession,
  magicLink,
  changePassword,
  resetPassword,
  sendVerificationEmail,
  changeEmail,
  deleteUser,
  linkSocial,
  useSession,
  verifyEmail,
  listAccounts,
  listSessions,
  revokeOtherSessions,
  revokeSessions,
} = authClient;
