import { PERMANENT_REDIRECTS } from "./redirects";

describe("permanent redirects", () => {
  it("preserves the externally linked starter introduction URL", () => {
    expect(PERMANENT_REDIRECTS).toContainEqual({
      source: "/blog/saas-starter-kit-intro",
      destination: "/blog/saas-starter-kit-developer-guide",
      permanent: true,
    });
  });

  it("keeps the pre-Stripe billing guide URL reachable", () => {
    expect(PERMANENT_REDIRECTS).toContainEqual({
      source: "/blog/creem-nextjs-billing-production-guide",
      destination: "/blog/stripe-nextjs-billing-production-guide",
      permanent: true,
    });
  });
});
