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

interface ValidateResult {
  success?: boolean;
  error?: string;
  totals?: Record<string, number>;
}

interface CopyStepResult {
  success?: boolean;
  error?: string;
  table?: string;
  count?: number;
}

/**
 * Inserta un lote en la tabla destino excluyendo columnas GENERATED
 * ALWAYS (p. ej. `search_vector` en invoices/cards): Postgres rechaza
 * valores explícitos en ellas; se detectan por el mensaje de error y se
 * eliminan del lote antes de reintentar.
 */
async function insertBatchSkippingGenerated(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  batch: Record<string, unknown>[],
) {
  for (;;) {
    const { error } = await supabase.from(table).insert(batch);
    if (!error) return null;
    const match = error.message.match(
      /non-DEFAULT value into column "([^"]+)"/,
    );
    if (!match) return error;
    const generatedColumn = match[1];
    for (const row of batch) {
      delete row[generatedColumn];
    }
  }
}

/**
 * Elimina del evento destino las filas de las 4 tablas copiadas
 * (orden inverso al de inserción) para no dejar una copia parcial.
 */
async function rollbackTarget(
  supabase: ReturnType<typeof createAdminClient>,
  targetCompanyId: number,
  targetEventId: string,
) {
  for (const t of CLEANUP_ORDER) {
    await supabase
      .from(t)
      .delete()
      .eq("company_id", targetCompanyId)
      .eq("event_id", targetEventId);
  }
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
 * Valida el par origen/destino de la copia de datos de prueba: ambas
 * empresas y eventos deben existir, origen ≠ destino y el destino debe
 * estar vacío en las 4 tablas. Devuelve además el conteo de filas del
 * origen por tabla para que el cliente muestre el avance esperado.
 */
async function validateCopyInternal(
  sourceCompanyId: number,
  sourceEventId: string,
  targetCompanyId: number,
  targetEventId: string,
): Promise<ValidateResult> {
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

  const totals: Record<string, number> = {};
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

    const { count: sourceCount, error: countError } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("company_id", sourceCompanyId)
      .eq("event_id", sourceEventId);
    if (countError) {
      return { error: `Error al contar "${table}" del origen: ${countError.message}` };
    }
    totals[table] = sourceCount || 0;
  }

  return { success: true, totals };
}

export const validateCopy = withRole(10, validateCopyInternal);

/**
 * Copia una sola tabla del evento origen al destino (se omite `id` y se
 * remapean company_id/event_id). Revalida que el par empresa/evento
 * exista y que el destino siga vacío en esa tabla; si la inserción
 * falla se revierten todas las tablas ya copiadas en el destino.
 */
async function copyTableInternal(
  sourceCompanyId: number,
  sourceEventId: string,
  targetCompanyId: number,
  targetEventId: string,
  table: string,
  context: { user: { id: string; email?: string } },
): Promise<CopyStepResult> {
  if (!COPY_TABLES.includes(table as (typeof COPY_TABLES)[number])) {
    return { error: `Tabla no permitida: ${table}` };
  }

  const supabase = createAdminClient();

  const pairError =
    (await validateCompanyEvent(
      supabase,
      sourceCompanyId,
      sourceEventId,
      "Origen",
    )) ||
    (await validateCompanyEvent(
      supabase,
      targetCompanyId,
      targetEventId,
      "Destino",
    ));
  if (pairError) return { error: pairError };

  const { count: existing } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("company_id", targetCompanyId)
    .eq("event_id", targetEventId);
  if (existing && existing > 0) {
    return {
      error: `El evento destino ya contiene ${existing} filas en "${table}".`,
    };
  }

  const { data: rows, error } = await fetchAllRows(
    supabase,
    table,
    sourceCompanyId,
    sourceEventId,
  );
  if (error) {
    return { error: `Error al leer "${table}" del origen: ${error.message}` };
  }

  const total = rows?.length || 0;
  if (total > 0) {
    // Se omite `id` (identity/uuid) y se remapean empresa/evento al destino
    const mapped = rows!.map(({ id: _id, ...rest }) => ({
      ...rest,
      company_id: targetCompanyId,
      event_id: targetEventId,
    }));

    for (let i = 0; i < mapped.length; i += INSERT_BATCH) {
      const batch = mapped.slice(i, i + INSERT_BATCH);
      const insError = await insertBatchSkippingGenerated(
        supabase,
        table,
        batch,
      );
      if (insError) {
        await rollbackTarget(supabase, targetCompanyId, targetEventId);
        return {
          error: `Error al copiar "${table}" (se revirtieron los datos del destino): ${insError.message}`,
        };
      }
    }
  }

  await supabase.from("user_activity_log").insert([
    {
      user_id: context.user.id,
      action: "CLONE_TEST_DATA",
      entity: table,
      entity_id: targetEventId,
      metadata: {
        source: { company_id: sourceCompanyId, event_id: sourceEventId },
        target: { company_id: targetCompanyId, event_id: targetEventId },
        table,
        count: total,
      },
      timestamp: new Date().toISOString(),
    },
  ]);

  return { success: true, table, count: total };
}

export const copyTable = withRole(10, copyTableInternal);
