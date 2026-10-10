import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * robots.txt: permite el sitio público y excluye el backoffice, la
 * autenticación, las APIs y las pantallas operativas del evento.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/auth", "/login", "/api", "/registro", "/ruleta", "/tombola"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
