import type { PublicCatalog } from "@/lib/validation/products";

/** Fila del CMS (`site_content`) usada por /productos. */
export interface CmsSection {
  section_key: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  content_order?: number | null;
  metadata?: Record<string, unknown> | null;
}

/** Texto de `metadata[key]` si es un string no vacío; si no, `fallback`. */
export function metaText(section: CmsSection | undefined, key: string, fallback: string): string {
  const value = section?.metadata?.[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

/** Texto del campo si no está vacío; si no, `fallback`. */
export function textOr(value: string | null | undefined, fallback: string): string {
  return value && value.trim() !== "" ? value.trim() : fallback;
}

/** Secciones cuyo `section_key` empieza con `prefix`, en el orden del CMS. */
export function sectionsWithPrefix(content: CmsSection[], prefix: string): CmsSection[] {
  return content
    .filter((s) => s.section_key.startsWith(prefix))
    .sort(
      (a, b) =>
        (a.content_order ?? 0) - (b.content_order ?? 0) ||
        a.section_key.localeCompare(b.section_key, "es", { numeric: true }),
    );
}

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
