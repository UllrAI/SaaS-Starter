import {
  APP_NAME,
  AVATAR_STYLE,
  COMPANY_NAME,
  CONTACT_EMAIL,
  GITHUB_URL,
  LEGAL_EMAIL,
  OGIMAGE,
  PAYMENT_PROVIDER,
  PRIVACY_EMAIL,
} from "./constants";

describe("application constants", () => {
  it("defines stable brand and provider values", () => {
    expect(APP_NAME).toBe("SaaS Starter");
    expect(COMPANY_NAME).toBe("UllrAI Lab");
    expect(AVATAR_STYLE).toBe("adventurer-neutral");
    expect(PAYMENT_PROVIDER).toBe("creem");
  });

  it("uses valid public URLs and contact addresses", () => {
    expect(GITHUB_URL).toBe("https://github.com/ullrai/saas-starter");
    expect(OGIMAGE).toBe("/og.png");
    for (const email of [CONTACT_EMAIL, LEGAL_EMAIL, PRIVACY_EMAIL]) {
      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }
  });
});
