// @ts-check

/**
 * @typedef {object} SiteConfig
 * @property {{name: string, companyName: string, avatarStyle: string}} brand
 * @property {{support: string, legal: string, privacy: string}} contact
 * @property {{repository: string, issues: string, releases: string, discussions: string, docs: string}} links
 * @property {{openGraphImage: string, twitterAccount: string}} assets
 * @property {{emailAuth: boolean, billing: boolean, uploads: boolean, ai: boolean}} features
 * @property {{provider: "stripe"}} billing
 */

const repository = "https://github.com/ullrai/saas-starter";

/** @type {SiteConfig} */
const SITE_CONFIG = Object.freeze({
  brand: {
    name:
      process.env.NODE_ENV === "development"
        ? "DEV - SaaS Starter"
        : "SaaS Starter",
    companyName: "UllrAI Lab",
    avatarStyle: "adventurer-neutral",
  },
  contact: {
    support: "support@ullrai.com",
    legal: "legal@ullrai.com",
    privacy: "privacy@ullrai.com",
  },
  links: {
    repository,
    issues: `${repository}/issues`,
    releases: `${repository}/releases`,
    discussions: `${repository}/discussions`,
    docs: `${repository}#readme`,
  },
  assets: {
    openGraphImage: "/og.png",
    twitterAccount: "@ullr_ai",
  },
  features: {
    emailAuth: true,
    billing: true,
    uploads: true,
    ai: true,
  },
  billing: {
    provider: "stripe",
  },
});

exports.SITE_CONFIG = SITE_CONFIG;
