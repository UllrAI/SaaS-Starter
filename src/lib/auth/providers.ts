import env from "@/env";

export type SocialProvider = "google" | "github" | "linkedin";

/**
 * Configuration for social providers with their environment variable keys
 */
export const providerConfigs: {
  name: SocialProvider;
  clientIdKey: keyof typeof env;
  clientSecretKey: keyof typeof env;
}[] = [
  {
    name: "google",
    clientIdKey: "GOOGLE_CLIENT_ID",
    clientSecretKey: "GOOGLE_CLIENT_SECRET",
  },
  {
    name: "github",
    clientIdKey: "GITHUB_CLIENT_ID",
    clientSecretKey: "GITHUB_CLIENT_SECRET",
  },
  {
    name: "linkedin",
    clientIdKey: "LINKEDIN_CLIENT_ID",
    clientSecretKey: "LINKEDIN_CLIENT_SECRET",
  },
];

/**
 * Get available social providers based on environment variables
 * This function checks which social login providers have both CLIENT_ID and CLIENT_SECRET configured
 */
export function getAvailableSocialProviders(): SocialProvider[] {
  return providerConfigs
    .filter(
      ({ clientIdKey, clientSecretKey }) =>
        env[clientIdKey] && env[clientSecretKey],
    )
    .map(({ name }) => name);
}

/**
 * Check if a specific social provider is available
 */
export function isSocialProviderAvailable(provider: SocialProvider): boolean {
  const availableProviders = getAvailableSocialProviders();
  return availableProviders.includes(provider);
}

/**
 * Get the total number of available social providers
 */
export function getAvailableSocialProvidersCount(): number {
  return getAvailableSocialProviders().length;
}
