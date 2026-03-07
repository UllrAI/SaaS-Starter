import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  magicLinkClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import type { auth } from "./server";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    magicLinkClient(),
    inferAdditionalFields<typeof auth>(),
  ],
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
