import type { SupabaseClient } from "@supabase/supabase-js";

/** Bucket de los catálogos en PDF de La Rioja Shop. */
export const CATALOG_PDF_BUCKET = "product_catalog_pdfs";

/**
 * Margen antes de considerar huérfano un PDF no referenciado: protege las
 * subidas en curso (el archivo existe en Storage antes de que el admin
 * confirme con `setCatalogPdf`).
 */
export const ORPHAN_MIN_AGE_MS = 60 * 60 * 1000;

/** Ruta dentro del bucket a partir de la URL pública de un PDF (o null). */
export function catalogPdfPathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const parts = url.split(`/${CATALOG_PDF_BUCKET}/`);
  return parts.length < 2 ? null : decodeURIComponent(parts[1].split("?")[0]);
}

/**
 * Borra los PDF huérfanos de una empresa: archivos de la carpeta
 * `{companyId}/` del bucket que ningún catálogo referencia en `pdf_url` y
 * que tienen más de `minAgeMs` de antigüedad. Cubre subidas no confirmadas
 * (pestaña cerrada tras subir) y borrados que fallaron. Requiere un cliente
 * con service role. Devuelve las rutas eliminadas; los errores solo se
 * registran (la limpieza nunca hace fallar la operación principal).
 */
export async function sweepOrphanCatalogPdfs(
  supabase: SupabaseClient,
  companyId: number,
  minAgeMs: number = ORPHAN_MIN_AGE_MS,
): Promise<string[]> {
  try {
    const { data: catalogs, error: catalogsError } = await supabase
      .from("product_catalogs")
      .select("pdf_url")
      .eq("company_id", companyId);
    if (catalogsError) throw catalogsError;
    const referenced = new Set(
      (catalogs ?? []).flatMap((c: { pdf_url: string | null }) => {
        const path = catalogPdfPathFromUrl(c.pdf_url);
        return path ? [path] : [];
      }),
    );

    const folder = String(companyId);
    const { data: files, error: listError } = await supabase.storage
      .from(CATALOG_PDF_BUCKET)
      .list(folder, { limit: 1000 });
    if (listError) throw listError;

    const cutoff = Date.now() - minAgeMs;
    const orphans = (files ?? [])
      .filter((f) => f.id) // las carpetas no tienen id
      .map((f) => ({ path: `${folder}/${f.name}`, created: Date.parse(f.created_at ?? "") }))
      .filter((f) => !referenced.has(f.path) && Number.isFinite(f.created) && f.created < cutoff)
      .map((f) => f.path);

    if (orphans.length > 0) {
      const { error: removeError } = await supabase.storage
        .from(CATALOG_PDF_BUCKET)
        .remove(orphans);
      if (removeError) throw removeError;
    }
    return orphans;
  } catch (err) {
    console.error("Error al limpiar PDF huérfanos de catálogos:", err);
    return [];
  }
}
