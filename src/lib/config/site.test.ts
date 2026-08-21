import { describe, expect, it } from "@jest/globals";

import { SITE_CONFIG } from "./site";
import {
  APP_NAME,
  CONTACT_EMAIL,
  GITHUB_URL,
  PAYMENT_PROVIDER,
} from "./constants";

describe("SITE_CONFIG", () => {
  it("is the source of truth for public site constants", () => {
    expect(APP_NAME).toBe(SITE_CONFIG.brand.name);
    expect(CONTACT_EMAIL).toBe(SITE_CONFIG.contact.support);
    expect(GITHUB_URL).toBe(SITE_CONFIG.links.repository);
    expect(PAYMENT_PROVIDER).toBe(SITE_CONFIG.billing.provider);
  });

  it("keeps optional starter capabilities enabled by default", () => {
    expect(SITE_CONFIG.features).toEqual({
      emailAuth: true,
      billing: true,
      uploads: true,
      ai: true,
    });
  });
});
