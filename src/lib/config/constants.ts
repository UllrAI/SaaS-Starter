// Brand Configuration
export const APP_NAME =
  process.env.NODE_ENV === "development"
    ? "DEV - SaaS Starter"
    : "SaaS Starter";
export const COMPANY_NAME = "UllrAI Lab";

export const TRIAL_DAYS = 7;

// https://www.dicebear.com/playground/
// DEFAULT: initials
export const AVATAR_STYLE = "adventurer-neutral";

// Contact Information
export const CONTACT_EMAIL = "support@ullrai.com";
export const LEGAL_EMAIL = "legal@ullrai.com";
export const PRIVACY_EMAIL = "privacy@ullrai.com";
export const RESEND_EMAIL_FROM = "noreply@mail.ullrai.com";

// External Links
export const GITHUB_URL = "https://github.com/ullrai/saas-starter";
export const VERCEL_DEPLOY_URL =
  "https://vercel.com/new/clone?repository-url=https://github.com/ullrai/saas-starter";

export const PAYMENT_PROVIDER = "creem" as const;
// SEO
export const OGIMAGE = "https://starter.ullrai.com/og.png";
export const TWITTERACCOUNT = "@ullr_ai";
