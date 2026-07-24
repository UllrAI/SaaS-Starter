// Brand Configuration
export const APP_NAME =
  process.env.NODE_ENV === "development"
    ? "DEV - SaaS Starter"
    : "SaaS Starter";
export const COMPANY_NAME = "UllrAI Lab";

// https://www.dicebear.com/playground/
// DEFAULT: initials
export const AVATAR_STYLE = "adventurer-neutral";

// Contact Information
export const CONTACT_EMAIL = "support@ullrai.com";
export const LEGAL_EMAIL = "legal@ullrai.com";
export const PRIVACY_EMAIL = "privacy@ullrai.com";

// External Links
export const GITHUB_URL = "https://github.com/ullrai/saas-starter";
export const GITHUB_ISSUES_URL = `${GITHUB_URL}/issues`;
export const GITHUB_RELEASES_URL = `${GITHUB_URL}/releases`;
export const GITHUB_DISCUSSIONS_URL = `${GITHUB_URL}/discussions`;
export const DOCS_URL = `${GITHUB_URL}#readme`;

export const PAYMENT_PROVIDER = "creem" as const;
// SEO
export const OGIMAGE = "/og.png";
export const TWITTERACCOUNT = "@ullr_ai";
