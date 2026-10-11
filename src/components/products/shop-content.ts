import type { PublicCatalog } from "@/lib/validation/products";

import {
  sectionsWithPrefix,
  textOr,
  type CmsSection,
} from "@/lib/cms-content";

export { metaText, sectionsWithPrefix, textOr, type CmsSection } from "@/lib/cms-content";

/** Foto del hero: URL y texto alternativo. */
export interface HeroPhoto {
  src: string;
  alt: string;
  /** Foto de producto recortada (respaldo): se muestra completa, sin recortar. */
  contain?: boolean;
}

/**
 * Fotos del hero: las de `productos_hero_foto_N` con imagen en el CMS y, si
 * faltan para completar `count`, fotos de productos del catálogo alternando
 * talleres (respaldo automático).
 */
export function heroPhotos(
  content: CmsSection[],
  catalogs: PublicCatalog[],
  count = 4,
): HeroPhoto[] {
  const fromCms = sectionsWithPrefix(content, "productos_hero_foto_")
    .filter((s) => s.image_url && s.image_url.trim() !== "")
    .map((s) => ({ src: s.image_url as string, alt: textOr(s.title, "Producto de La Rioja") }));
  if (fromCms.length >= count) return fromCms.slice(0, count);

  // Productos con foto por catálogo, intercalados (Panadería, Arte y Costura, …).
  const perCatalog = catalogs.map((c) =>
    c.lines.flatMap((l) => l.products).filter((p) => p.image_url),
  );
  // Sin repetir foto ni nombre (p. ej. dos «Tote bag floral» con fotos distintas).
  const photos: HeroPhoto[] = [...fromCms];
  const seen = new Set(fromCms.flatMap((p) => [p.src, p.alt.toLowerCase()]));
  for (let i = 0; photos.length < count && perCatalog.some((list) => i < list.length); i++) {
    for (const list of perCatalog) {
      const p = list[i];
      if (!p?.image_url || photos.length >= count) continue;
      const key = p.name.toLowerCase();
      if (seen.has(p.image_url) || seen.has(key)) continue;
      seen.add(p.image_url).add(key);
      photos.push({ src: p.image_url, alt: p.name, contain: true });
    }
  }
  return photos;
}
