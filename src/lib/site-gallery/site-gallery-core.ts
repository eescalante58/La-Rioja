import { createAdminClient } from "@/lib/supabase/server";
import { SITE_GALLERY_BUCKET, type SitePageType } from "@/lib/validation/site-gallery";

/**
 * Normaliza el nombre de la página a un slug limpio para nombres de carpetas en Storage.
 * "quienes somos" y "about" se homologan a "quienes-somos".
 */
export function toPageSlug(page: string): string {
  if (page === "quienes somos" || page === "about") {
    return "quienes-somos";
  }
  return page.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");
}

/**
 * Construye el prefijo de ruta dentro del bucket para una galería específica.
 * Formato: "galerias/{pageSlug}/{galleryKey}/"
 */
export function storagePrefix(page: string, galleryKey: string): string {
  return `galerias/${toPageSlug(page)}/${galleryKey}/`;
}

/**
 * Limpia el nombre del archivo para generar un texto alternativo por defecto amigable.
 * Ejemplo: "Comedor 1.jpeg" -> "Comedor", "Huerto 2.mp4" -> "Huerto".
 * Garantiza entre 5 y 150 caracteres.
 */
export function cleanAltFromFileName(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^.]+$/, "");
  const cleaned = withoutExt
    .replace(/[_-]+/g, " ")
    .replace(/\s*\d+$/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length >= 5) {
    return cleaned.slice(0, 150);
  }
  const padded = `Espacio ${cleaned}`.trim();
  if (padded.length >= 5) {
    return padded.slice(0, 150);
  }
  return "Instalaciones de La Rioja";
}

/**
 * Elimina uno o más objetos del bucket de galerías del sitio de forma segura.
 * Omite rutas nulas o vacías.
 */
export async function removeStorageObjects(paths: (string | null | undefined)[]): Promise<void> {
  const validPaths = paths.filter((p): p is string => typeof p === "string" && p.trim().length > 0);
  if (validPaths.length === 0) return;

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(SITE_GALLERY_BUCKET).remove(validPaths);
  if (error) {
    console.error(`[site-gallery-core] Error al remover objetos de ${SITE_GALLERY_BUCKET}:`, error);
  }
}
