/**
 * Acceso centralizado a los talleres del CFL.
 * Fuente de verdad: site_content, page = 'programs', section_key LIKE 'cl_taller_%'.
 * El campo metadata.grupo distingue "productivo" de "vida-independiente".
 */

import { createStaticClient } from "@/lib/supabase/server";
import { workshopGroupSchema } from "@/lib/validation/cms";
import type { Workshop } from "@/components/programs/types";

const NUMEROS = [
  "cero",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
];

/** Número cardinal en palabras para texto como "cinco talleres". Cifra si n > 10. */
export function numeroEnPalabras(n: number): string {
  return NUMEROS[n] ?? String(n);
}

/** Primera letra en mayúscula. */
export function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface TallerDbRow {
  id: string;
  section_key: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  content_order: number | null;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
}

function metaStr(meta: Record<string, unknown>, key: string): string {
  const v = meta[key];
  return typeof v === "string" ? v.trim() : "";
}

function rowToWorkshop(row: TallerDbRow): Workshop {
  const meta = row.metadata ?? {};
  const name = row.title?.trim() ?? "";
  const imageUrl = row.image_url?.trim() || metaStr(meta, "foto");
  return {
    slug: row.section_key,
    name,
    group: workshopGroupSchema.parse(meta.grupo),
    skills: metaStr(meta, "habilidades"),
    impact: metaStr(meta, "impacto"),
    products: metaStr(meta, "productos"),
    image: imageUrl
      ? {
          url: imageUrl,
          alt: metaStr(meta, "foto_alt") || `Estudiantes en el taller de ${name}`,
        }
      : undefined,
    badge: metaStr(meta, "insignia"),
  };
}

/**
 * Todos los talleres activos, separados por grupo.
 * Una sola consulta a la base de datos; la página Programas usa esta función.
 */
export async function getTalleresGroups(): Promise<{
  productivos: Workshop[];
  vidaIndependiente: Workshop[];
}> {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("site_content")
    .select("id, section_key, title, description, image_url, content_order, is_active, metadata")
    .eq("page", "programs")
    .like("section_key", "cl_taller_%")
    .eq("is_active", true)
    .order("content_order", { ascending: true });

  // El LIKE de SQL trata '_' como comodín, por lo que 'cl_talleres' (fila encabezado)
  // también coincide con 'cl_taller_%'. Se filtra en JS con startsWith exacto.
  const rows = ((data ?? []) as TallerDbRow[]).filter(
    (r) => r.title?.trim() && r.section_key.startsWith("cl_taller_"),
  );
  return {
    productivos: rows
      .filter((r) => workshopGroupSchema.parse(r.metadata?.grupo) === "productivo")
      .map(rowToWorkshop),
    vidaIndependiente: rows
      .filter((r) => workshopGroupSchema.parse(r.metadata?.grupo) === "vida-independiente")
      .map(rowToWorkshop),
  };
}

/** Talleres productivos activos, ordenados por content_order. Usada en la página de Inicio. */
export async function getTalleres(): Promise<Workshop[]> {
  const { productivos } = await getTalleresGroups();
  return productivos;
}
