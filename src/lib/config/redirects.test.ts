import { PERMANENT_REDIRECTS } from "./redirects";

describe("permanent redirects", () => {
  it("preserves the externally linked starter introduction URL", () => {
    expect(PERMANENT_REDIRECTS).toContainEqual({
      source: "/blog/saas-starter-kit-intro",
      destination: "/blog/saas-starter-kit-developer-guide",
      permanent: true,
    });
  });
});
