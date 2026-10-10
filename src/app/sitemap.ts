import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Páginas públicas indexables con su frecuencia de cambio y prioridad. */
const PAGES: { path: string; changeFrequency: "weekly" | "monthly"; priority: number }[] = [
  { path: "", changeFrequency: "monthly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/programs", changeFrequency: "monthly", priority: 0.8 },
  { path: "/productos", changeFrequency: "weekly", priority: 0.8 },
  { path: "/bingo", changeFrequency: "monthly", priority: 0.6 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
];

/**
 * Sitemap del sitio público. Sin `lastModified`: una fecha que cambia en
 * cada generación no aporta señal a los buscadores.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
