import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { isMatriculaActive } from "@/lib/matricula/matricula-service";

export const revalidate = 60;

/** Páginas públicas indexables con su frecuencia de cambio y prioridad. */
const BASE_PAGES: { path: string; changeFrequency: "weekly" | "monthly"; priority: number }[] = [
  { path: "", changeFrequency: "monthly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/programs", changeFrequency: "monthly", priority: 0.8 },
  { path: "/productos", changeFrequency: "weekly", priority: 0.8 },
  { path: "/bingo", changeFrequency: "monthly", priority: 0.6 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/apoyanos", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacidad", changeFrequency: "monthly", priority: 0.5 },
];

/**
 * Sitemap del sitio público. Incluye /matricula únicamente si está activa en el CMS.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const matriculaActive = await isMatriculaActive();

  const pages = [
    ...BASE_PAGES,
    ...(matriculaActive
      ? [
          {
            path: "/matricula",
            changeFrequency: "weekly" as const,
            priority: 0.9,
          },
        ]
      : []),
  ];

  return pages.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
