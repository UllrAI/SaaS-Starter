import robots from "./robots";

jest.mock("@/lib/url", () => ({
  absoluteUrl: (path: string) => `https://starter.example.com${path}`,
}));

describe("robots metadata", () => {
  it("keeps public content crawlable and excludes private application routes", () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard/",
          "/device",
          "/login",
          "/payment-status",
          "/signup",
        ],
      },
      sitemap: "https://starter.example.com/sitemap.xml",
    });
  });
});
