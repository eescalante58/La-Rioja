import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * robots.txt: permite el sitio público y excluye el backoffice, la
 * autenticación, las APIs y las pantallas operativas del evento.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/auth", "/login", "/api", "/registro", "/ruleta", "/tombola"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: [
          "/",
          "/favicon.ico",
          "/favicon-48x48.png",
          "/favicon-96x96.png",
          "/icon-192.png",
          "/apple-touch-icon.png",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
