"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { withRole } from "@/lib/auth/guards";

/**
 * Tablas copiadas por la herramienta "Crear datos de prueba".
 * Orden de inserción: invoices antes que cards porque el trigger
 * `trg_cards_validate_invoice_event` valida la coherencia
 * factura-evento al insertar cartones vendidos.
 */
const COPY_TABLES = [
  "invoices",
  "cards",
  "students",
  "students_cards",
] as const;

/** Orden inverso para limpiar el destino si la copia falla a mitad. */
const CLEANUP_ORDER = [
  "students_cards",
  "cards",
  "students",
  "invoices",
] as const;

const PAGE_SIZE = 1000;
const INSERT_BATCH = 500;

interface CloneResult {
  success?: boolean;
  error?: string;
  copied?: Record<string, number>;
}

/**
 * Obtiene todas las filas de una tabla filtradas por empresa/evento,
 * paginando en bloques de 1000 (límite por consulta de PostgREST).
 * Todas las tablas copiadas tienen columna `id` para orden estable.
 */
async function fetchAllRows(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  companyId: number,
  eventId: string,
) {
  const all: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("company_id", companyId)
      .eq("event_id", eventId)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) return { data: null, error };
    all.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return { data: all, error: null };
}

/**
 * Valida que la empresa exista y que el evento pertenezca a ella.
 */
async function validateCompanyEvent(
  supabase: ReturnType<typeof createAdminClient>,
  companyId: number,
  eventId: string,
  label: string,
) {
  const { data: company } = await supabase
    .from("companies")
    .select("company_id")
    .eq("company_id", companyId)
    .maybeSingle();
  if (!company) {
    return `${label}: la empresa ${companyId} no existe.`;
  }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .maybeSingle();
  if (!event) {
    return `${label}: el evento "${eventId}" no existe en la empresa ${companyId}.`;
  }

  return null;
}

/**
 * Copia la totalidad de datos de un evento origen a un evento destino
 * (posiblemente en otra empresa) para las tablas cards, students,
 * students_cards e invoices.
 *
 * Validaciones:
 * - Empresa y evento de origen y destino deben existir.
 * - Origen y destino no pueden ser el mismo par empresa+evento.
 * - El destino debe estar vacío en las 4 tablas (evita mezclar datos
 *   de prueba con datos reales o duplicar PKs).
 *
 * Si una inserción falla a mitad de la copia se eliminan las filas ya
 * insertadas en el destino para no dejar un estado parcial.
 */
async function cloneEventDataInternal(
  sourceCompanyId: number,
  sourceEventId: string,
  targetCompanyId: number,
  targetEventId: string,
  context: { user: { id: string; email?: string } },
): Promise<CloneResult> {
  const supabase = createAdminClient();

  if (!sourceCompanyId || !sourceEventId || !targetCompanyId || !targetEventId) {
    return { error: "Debe indicar empresa y evento de origen y destino." };
  }

  if (
    sourceCompanyId === targetCompanyId &&
    sourceEventId === targetEventId
  ) {
    return { error: "El origen y el destino no pueden ser el mismo evento." };
  }

  const srcError = await validateCompanyEvent(
    supabase,
    sourceCompanyId,
    sourceEventId,
    "Origen",
  );
  if (srcError) return { error: srcError };

  const tgtError = await validateCompanyEvent(
    supabase,
    targetCompanyId,
    targetEventId,
    "Destino",
  );
  if (tgtError) return { error: tgtError };

  // El destino debe estar vacío en las 4 tablas
  for (const table of COPY_TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("company_id", targetCompanyId)
      .eq("event_id", targetEventId);
    if (error) {
      return { error: `Error al verificar destino en ${table}: ${error.message}` };
    }
    if (count && count > 0) {
      return {
        error: `El evento destino ya contiene ${count} filas en "${table}". El destino debe estar vacío para evitar duplicados.`,
      };
    }
  }

  const copied: Record<string, number> = {};

  for (const table of COPY_TABLES) {
    const { data: rows, error } = await fetchAllRows(
      supabase,
      table,
      sourceCompanyId,
      sourceEventId,
    );
    if (error) {
      return { error: `Error al leer "${table}" del origen: ${error.message}` };
    }
    if (!rows || rows.length === 0) {
      copied[table] = 0;
      continue;
    }

    // Se omite `id` (identity/uuid) y se remapean empresa/evento al destino
    const mapped = rows.map(({ id: _id, ...rest }) => ({
      ...rest,
      company_id: targetCompanyId,
      event_id: targetEventId,
    }));

    for (let i = 0; i < mapped.length; i += INSERT_BATCH) {
      const batch = mapped.slice(i, i + INSERT_BATCH);
      const { error: insError } = await supabase.from(table).insert(batch);
      if (insError) {
        // Rollback del destino para no dejar una copia parcial
        for (const t of CLEANUP_ORDER) {
          await supabase
            .from(t)
            .delete()
            .eq("company_id", targetCompanyId)
            .eq("event_id", targetEventId);
        }
        return {
          error: `Error al copiar "${table}" (se revirtieron los datos del destino): ${insError.message}`,
        };
      }
    }

    copied[table] = rows.length;
  }

  await supabase.from("user_activity_log").insert([
    {
      user_id: context.user.id,
      action: "CLONE_TEST_DATA",
      entity: "events",
      entity_id: targetEventId,
      metadata: {
        source: { company_id: sourceCompanyId, event_id: sourceEventId },
        target: { company_id: targetCompanyId, event_id: targetEventId },
        copied,
      },
      timestamp: new Date().toISOString(),
    },
  ]);

  return { success: true, copied };
}

export const cloneEventData = withRole(10, cloneEventDataInternal);
