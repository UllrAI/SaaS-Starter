const mockEnv = {
  GOOGLE_CLIENT_ID: undefined as string | undefined,
  GOOGLE_CLIENT_SECRET: undefined as string | undefined,
  GITHUB_CLIENT_ID: undefined as string | undefined,
  GITHUB_CLIENT_SECRET: undefined as string | undefined,
  LINKEDIN_CLIENT_ID: undefined as string | undefined,
  LINKEDIN_CLIENT_SECRET: undefined as string | undefined,
};

jest.mock("@/env", () => ({
  get GOOGLE_CLIENT_ID() {
    return mockEnv.GOOGLE_CLIENT_ID;
  },
  get GOOGLE_CLIENT_SECRET() {
    return mockEnv.GOOGLE_CLIENT_SECRET;
  },
  get GITHUB_CLIENT_ID() {
    return mockEnv.GITHUB_CLIENT_ID;
  },
  get GITHUB_CLIENT_SECRET() {
    return mockEnv.GITHUB_CLIENT_SECRET;
  },
  get LINKEDIN_CLIENT_ID() {
    return mockEnv.LINKEDIN_CLIENT_ID;
  },
  get LINKEDIN_CLIENT_SECRET() {
    return mockEnv.LINKEDIN_CLIENT_SECRET;
  },
}));

import { getAvailableSocialProviders, providerConfigs } from "./providers";

describe("social provider configuration", () => {
  beforeEach(() => {
    Object.keys(mockEnv).forEach((key) => {
      mockEnv[key as keyof typeof mockEnv] = undefined;
    });
  });

  it("defines each supported provider once", () => {
    expect(providerConfigs.map(({ name }) => name)).toEqual([
      "google",
      "github",
      "linkedin",
    ]);
  });

  it("returns only providers with a complete credential pair", () => {
    mockEnv.GOOGLE_CLIENT_ID = "google-id";
    mockEnv.GOOGLE_CLIENT_SECRET = "google-secret";
    mockEnv.GITHUB_CLIENT_ID = "github-id";

    expect(getAvailableSocialProviders()).toEqual(["google"]);
  });

  it("returns no provider when credentials are absent", () => {
    expect(getAvailableSocialProviders()).toEqual([]);
  });
});
