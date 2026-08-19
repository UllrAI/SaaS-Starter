export const PERMANENT_REDIRECTS = [
  {
    source: "/blog/saas-starter-kit-intro",
    destination: "/blog/saas-starter-kit-developer-guide",
    permanent: true,
  },
] satisfies Array<{
  source: string;
  destination: string;
  permanent: boolean;
}>;
