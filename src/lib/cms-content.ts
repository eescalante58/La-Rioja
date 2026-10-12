/**
 * Utilidades para leer filas del CMS (`site_content`) en páginas públicas.
 * Un texto vacío cuenta como «sin dato»: la página lo oculta o usa un respaldo.
 */

import { cmsInternalHrefSchema } from "@/lib/validation/cms";

/** Fila del CMS (`site_content`) tal como la usan las páginas públicas. */
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

/** Lista de textos no vacíos de `metadata[key]` (ignora lo que no sea string). */
export function metaStrings(section: CmsSection | undefined, key: string): string[] {
  const value = section?.metadata?.[key];
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .map((v) => v.trim());
}

/**
 * Lista de objetos de `metadata[key]` con los campos de texto pedidos.
 * Descarta los elementos a los que les falte `required`.
 */
export function metaRecords<K extends string>(
  section: CmsSection | undefined,
  key: string,
  fields: readonly K[],
  required: K,
): Record<K, string>[] {
  const value = section?.metadata?.[key];
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    if (typeof item !== "object" || item === null) return [];
    const source = item as Record<string, unknown>;
    const record = Object.fromEntries(
      fields.map((f) => [f, typeof source[f] === "string" ? (source[f] as string).trim() : ""]),
    ) as Record<K, string>;
    return record[required] ? [record] : [];
  });
}

/** Imagen de la fila: la subida al CMS (`image_url`) o `metadata.foto` como respaldo. */
export function sectionImage(section: CmsSection | undefined): string | undefined {
  return textOr(section?.image_url, metaText(section, "foto", "")) || undefined;
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

/**
 * Enlace interno de `metadata[key]` validado con `cmsInternalHrefSchema`
 * (ruta del sitio o ancla); si falta o no es válido, `fallback`.
 */
export function metaHref(section: CmsSection | undefined, key: string, fallback: string): string {
  const parsed = cmsInternalHrefSchema.safeParse(section?.metadata?.[key]);
  return parsed.success && parsed.data !== "" ? parsed.data : fallback;
}
