import { MetadataRoute } from "next";
import env from "@/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Disallow specific paths if needed, e.g., admin panels, private user data
        // disallow: ['/admin/', '/api/auth/session'],
      },
    ],
    sitemap: `${env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
    // host: env.NEXT_PUBLIC_APP_URL, // Optional: Specifies the preferred domain (useful if you have multiple domains pointing to the same site)
  };
}
