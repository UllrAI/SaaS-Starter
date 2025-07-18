import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as tables from "@/database/tables";
import env from "@/env";
import { db } from "@/database";
import { sendMagicLink } from "@/emails/magic-link";
import { APP_NAME } from "@/lib/config/constants";
// 移除: import { UAParser } from "ua-parser-js";
import { providerConfigs } from "./providers";

// Dynamically build social providers based on environment variables
const socialProviders: Record<
  string,
  { clientId: string; clientSecret: string }
> = {};

// Build social providers object based on available environment variables using unified configuration
providerConfigs.forEach(({ name, clientIdKey, clientSecretKey }) => {
  const clientId = env[clientIdKey];
  const clientSecret = env[clientSecretKey];

  if (clientId && clientSecret) {
    socialProviders[name] = {
      clientId: clientId as string,
      clientSecret: clientSecret as string,
    };
  }
});

export const auth = betterAuth({
  appName: APP_NAME,
  baseURL: env.NEXT_PUBLIC_APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
  logger: {
    disabled: process.env.NODE_ENV === "production",
    level: "debug",
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    cookieCache: {
      enabled: false,
    },
    // 我们不再预先解析和存储这些字段，所以可以从附加字段中移除
    // better-auth 会自动存储原始的 userAgent
    additionalFields: {},
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
    },
  },
  socialProviders,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...tables,
    },
    usePlural: true,
  }),
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github", "linkedin"],
    },
  },
  // 完全移除 databaseHooks，因为我们不再在创建会话时进行解析
  // databaseHooks: { ... },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }, request) => {
        if (process.env.NODE_ENV === "development") {
          console.log("✨ Magic link: " + url);
        }
        await sendMagicLink(email, url, request);
      },
    }),
  ],
});
