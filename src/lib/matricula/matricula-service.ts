import { createStaticClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import crypto from "crypto";

export type SiteContent = Database["public"]["Tables"]["site_content"]["Row"];

/**
 * Comprueba de forma estricta si la página de Matrícula está activa públicamente.
 * Regla técnica:
 * - Debe existir EXACTAMENTE un registro con page = 'matricula', section_key = 'pestaña' e is_active = true.
 * - Si existen duplicados, 0 filas, is_active === false/null o falla la consulta, retorna false.
 */
export async function isMatriculaActive(): Promise<boolean> {
  try {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("id, is_active")
      .eq("page", "matricula")
      .eq("section_key", "pestaña");

    if (error || !data) {
      return false;
    }

    // Exactamente 1 fila y debe estar activa
    if (data.length === 1 && data[0].is_active === true) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Estructura tipada con las secciones y configuraciones agrupadas de Matrícula.
 */
export interface MatriculaPageData {
  pestaña: SiteContent | null;
  intro: SiteContent | null;
  hero: SiteContent | null;
  cupos: SiteContent | null;
  programas: SiteContent | null;
  programaColegio: SiteContent | null;
  programaCfl: SiteContent | null;
  proceso: SiteContent | null;
  pasos: SiteContent[];
  /** Fila `cl_admision` de la página `programs` (fuente única homologada). */
  admisionIntro: SiteContent | null;
  /** Filas `cl_paso_*` activas de la página `programs` (fuente única homologada). */
  admisionPasos: SiteContent[];
  cierre: SiteContent | null;
  ctaMovil: SiteContent | null;
  formulario: SiteContent | null;
  config: SiteContent | null;
  whatsapp: SiteContent | null;
  seo: SiteContent | null;
  utm: SiteContent | null;
}

/**
 * Obtiene y agrupa todas las secciones de Matrícula desde public.site_content,
 * incluyendo las filas homologadas de admisión (`cl_admision` y `cl_paso_*`) de `programs`.
 */
export async function getMatriculaPageData(): Promise<MatriculaPageData> {
  const supabase = createStaticClient();
  const [{ data: matriculaData }, { data: programsData }] = await Promise.all([
    supabase
      .from("site_content")
      .select("*")
      .eq("page", "matricula")
      .order("content_order", { ascending: true }),
    supabase
      .from("site_content")
      .select("*")
      .eq("page", "programs")
      .or("section_key.eq.cl_admision,section_key.like.cl_paso_%")
      .eq("is_active", true)
      .order("content_order", { ascending: true }),
  ]);

  const rows = (matriculaData || []) as SiteContent[];
  const findRow = (key: string) => rows.find((r) => r.section_key === key) || null;

  const pasos = rows.filter(
    (r) => r.section_key.startsWith("matricula_paso_") && r.is_active === true
  );

  const progRows = (programsData || []) as SiteContent[];
  const admisionIntro = progRows.find((r) => r.section_key === "cl_admision") || null;
  const admisionPasos = progRows.filter(
    (r) => r.section_key.startsWith("cl_paso_") && Boolean(r.title?.trim())
  );

  return {
    pestaña: findRow("pestaña"),
    intro: findRow("matricula_intro"),
    hero: findRow("matricula_hero"),
    cupos: findRow("matricula_cupos"),
    programas: findRow("matricula_programas"),
    programaColegio: findRow("matricula_programa_colegio"),
    programaCfl: findRow("matricula_programa_cfl"),
    proceso: findRow("matricula_proceso"),
    pasos,
    admisionIntro,
    admisionPasos,
    cierre: findRow("matricula_cierre"),
    ctaMovil: findRow("matricula_cta_movil"),
    formulario: findRow("matricula_formulario"),
    config: findRow("matricula_config"),
    whatsapp: findRow("matricula_whatsapp"),
    seo: findRow("matricula_seo"),
    utm: findRow("matricula_utm"),
  };
}

/**
 * Calcula un hash SHA-256 normalizado de los datos de la solicitud para control de idempotencia.
 */
export function calculatePayloadHash(payload: {
  name: string;
  email?: string | null;
  phone?: string | null;
  type: string;
  message: string;
}): string {
  const normalized = [
    payload.name.trim().toLowerCase(),
    (payload.email || "").trim().toLowerCase(),
    (payload.phone || "").trim(),
    payload.type.trim(),
    payload.message.trim(),
  ].join("|");

  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export { resolveWhatsAppUrl } from "./whatsapp";
