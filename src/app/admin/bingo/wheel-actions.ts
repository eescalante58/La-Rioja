"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { withRole, withCompanyAccess } from "@/lib/auth/guards";
import { randomInt } from "node:crypto";
import { z } from "zod";

/**
 * Server actions del módulo Ruleta La Rioja.
 *
 * Modelo: una "ruleta" es un wheel_configs (company_id + event_id + mode +
 * wheel_name). Los segmentos viven en wheel_items (modo Premios y
 * Participantes); en modo Cartones los segmentos se generan al vuelo desde
 * `cards` con card_status = 'Vendido'. Cada giro se audita en wheel_spins.
 *
 * Seguridad: las operaciones admin pasan por withRole/withCompanyAccess;
 * la lectura pública y el registro de giros usan service role filtrando
 * estrictamente por ruletas publicadas.
 */

const WHEEL_MODES = ["Premios", "Cartones", "Participantes"] as const;

/** Sanitiza texto eliminando etiquetas HTML. */
function sanitizeInput(str: string): string {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "");
}

const wheelConfigSchema = z.object({
  id: z.number().int().positive().optional(),
  company_id: z.number().int().positive(),
  event_id: z.string().min(1),
  mode: z.enum(WHEEL_MODES),
  wheel_name: z.string().min(1).max(80),
});

const wheelItemSchema = z.object({
  label: z.string().min(1).max(120),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  quantity: z.number().int().min(1).default(1),
  position: z.number().int().min(0).nullable().optional(),
  is_active: z.boolean().default(true),
});

// ============================================================================
// ADMIN — lectura
// ============================================================================

/**
 * Devuelve las ruletas de un evento con sus items ordenados por position.
 * En modo Cartones no hay items persistidos (se generan desde cards).
 */
async function getWheelsInternal(companyId: number, eventId: string) {
  const supabase = createAdminClient();

  const { data: configs, error: cfgError } = await supabase
    .from("wheel_configs")
    .select("*")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .order("mode")
    .order("wheel_name");

  if (cfgError) return { error: cfgError.message };

  const wheelIds = (configs || []).map((c) => c.id);
  const { data: items, error: itemsError } = wheelIds.length
    ? await supabase
        .from("wheel_items")
        .select("*")
        .in("wheel_id", wheelIds)
        .order("position", { ascending: true, nullsFirst: false })
        .order("id")
    : { data: [], error: null };

  if (itemsError) return { error: itemsError.message };

  const wheels = (configs || []).map((cfg) => ({
    ...cfg,
    items: (items || []).filter((i) => i.wheel_id === cfg.id),
  }));

  return { data: wheels };
}

export const getWheels = withRole(4, withCompanyAccess(getWheelsInternal, 0));

/**
 * Cartones vendidos del evento: segmentos del modo 'Cartones'.
 */
async function getSoldCardsInternal(companyId: number, eventId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cards")
    .select("card_number")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .eq("card_status", "Vendido")
    .order("card_number");

  if (error) return { error: error.message };
  return { data: (data || []).map((c) => c.card_number) };
}

export const getSoldCards = withRole(4, withCompanyAccess(getSoldCardsInternal, 0));

/**
 * Historial de giros de una ruleta (o de todo el evento si wheelId es null).
 */
async function getWheelSpinsInternal(
  companyId: number,
  eventId: string,
  wheelId: number | null,
) {
  const supabase = createAdminClient();
  let query = supabase
    .from("wheel_spins")
    .select("*")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .order("spun_at", { ascending: false })
    .limit(200);

  if (wheelId) query = query.eq("wheel_id", wheelId);

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { data };
}

export const getWheelSpins = withRole(
  4,
  withCompanyAccess(getWheelSpinsInternal, 0),
);

// ============================================================================
// ADMIN — escritura
// ============================================================================

/**
 * Crea o actualiza una ruleta. Devuelve el id de la config guardada.
 */
async function saveWheelConfigInternal(payload: {
  id?: number;
  company_id: number;
  event_id: string;
  mode: string;
  wheel_name: string;
}) {
  const validation = wheelConfigSchema.safeParse(payload);
  if (!validation.success) {
    return {
      error:
        "Datos inválidos: " +
        validation.error.issues.map((e) => e.message).join(", "),
    };
  }
  const data = validation.data;
  const supabase = await createClient();

  const row = {
    company_id: data.company_id,
    event_id: data.event_id,
    mode: data.mode,
    wheel_name: sanitizeInput(data.wheel_name).trim(),
  };

  const { data: saved, error } = data.id
    ? await supabase
        .from("wheel_configs")
        .update(row)
        .eq("id", data.id)
        .eq("company_id", data.company_id)
        .select("id")
        .single()
    : await supabase
        .from("wheel_configs")
        .insert(row)
        .select("id")
        .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error: `Ya existe una ruleta '${data.mode}' llamada '${data.wheel_name}' en este evento.`,
      };
    }
    return { error: error.message };
  }

  // Sincroniza la clave desnormalizada de los items existentes
  if (data.id) {
    await supabase
      .from("wheel_items")
      .update({
        event_id: data.event_id,
        mode: data.mode,
        wheel_name: row.wheel_name,
      })
      .eq("wheel_id", data.id);
  }

  revalidatePath("/admin/bingo");
  return { success: true, id: saved.id };
}

export const saveWheelConfig = withRole(
  4,
  withCompanyAccess(saveWheelConfigInternal, 0),
);

/**
 * Reemplaza los items de una ruleta (delete + insert) en una sola operación
 * lógica. Solo aplica a modos Premios y Participantes.
 */
async function saveWheelItemsInternal(
  companyId: number,
  wheelId: number,
  items: Array<{
    label: string;
    color?: string | null;
    quantity?: number;
    position?: number | null;
    is_active?: boolean;
  }>,
) {
  const supabase = await createClient();

  // Verifica que la ruleta existe y pertenece a la empresa
  const { data: cfg, error: cfgError } = await supabase
    .from("wheel_configs")
    .select("id, company_id, event_id, mode, wheel_name")
    .eq("id", wheelId)
    .eq("company_id", companyId)
    .single();

  if (cfgError || !cfg) return { error: "No se encontró la ruleta." };

  const validation = z.array(wheelItemSchema).max(200).safeParse(items);
  if (!validation.success) {
    return {
      error:
        "Datos inválidos: " +
        validation.error.issues.map((e) => e.message).join(", "),
    };
  }

  const { error: delError } = await supabase
    .from("wheel_items")
    .delete()
    .eq("wheel_id", wheelId)
    .eq("company_id", companyId);

  if (delError) return { error: delError.message };

  if (validation.data.length > 0) {
    const rows = validation.data.map((item, idx) => ({
      wheel_id: wheelId,
      company_id: companyId,
      event_id: cfg.event_id,
      mode: cfg.mode,
      wheel_name: cfg.wheel_name,
      label: sanitizeInput(item.label).trim(),
      color: item.color ?? null,
      quantity: item.quantity ?? 1,
      position: item.position ?? idx + 1,
      is_active: item.is_active ?? true,
    }));

    const { error: insError } = await supabase
      .from("wheel_items")
      .insert(rows);

    if (insError) return { error: insError.message };
  }

  revalidatePath("/admin/bingo");
  return { success: true };
}

export const saveWheelItems = withRole(
  4,
  withCompanyAccess(saveWheelItemsInternal, 0),
);

/**
 * Publica/despublica una ruleta para la página de proyección.
 */
async function toggleWheelPublishedInternal(
  companyId: number,
  wheelId: number,
  published: boolean,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("wheel_configs")
    .update({ published })
    .eq("id", wheelId)
    .eq("company_id", companyId);

  if (error) return { error: error.message };
  revalidatePath("/admin/bingo");
  revalidatePath("/ruleta");
  return { success: true };
}

export const toggleWheelPublished = withRole(
  4,
  withCompanyAccess(toggleWheelPublishedInternal, 0),
);

/**
 * Elimina una ruleta y sus items (cascade) e historial de giros.
 */
async function deleteWheelConfigInternal(companyId: number, wheelId: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("wheel_configs")
    .delete()
    .eq("id", wheelId)
    .eq("company_id", companyId);

  if (error) return { error: error.message };
  revalidatePath("/admin/bingo");
  return { success: true };
}

export const deleteWheelConfig = withRole(
  4,
  withCompanyAccess(deleteWheelConfigInternal, 0),
);

// ============================================================================
// PÚBLICO — página /ruleta (proyección, sin login)
// ============================================================================

interface WheelSegment {
  itemId: number | null;
  label: string;
  color: string | null;
  cardNumber?: number;
}

/**
 * Construye los segmentos de una ruleta:
 * - Premios/Participantes: items activos (y con stock en Premios).
 * - Cartones: números de cards con card_status='Vendido'.
 */
async function buildSegments(
  supabase: any,
  cfg: { id: number; company_id: number; event_id: string; mode: string },
): Promise<WheelSegment[]> {
  if (cfg.mode === "Cartones") {
    const { data } = await supabase
      .from("cards")
      .select("card_number")
      .eq("company_id", cfg.company_id)
      .eq("event_id", cfg.event_id)
      .eq("card_status", "Vendido")
      .order("card_number");

    return (data || []).map((c: any) => ({
      itemId: null,
      label: `#${c.card_number}`,
      color: null,
      cardNumber: c.card_number,
    }));
  }

  let query = supabase
    .from("wheel_items")
    .select("id, label, color, quantity")
    .eq("wheel_id", cfg.id)
    .eq("is_active", true)
    .order("position", { ascending: true, nullsFirst: false })
    .order("id");

  // En Premios solo participan segmentos con stock
  if (cfg.mode === "Premios") query = query.gt("quantity", 0);

  const { data } = await query;
  return (data || []).map((i: any) => ({
    itemId: i.id,
    label: i.label,
    color: i.color,
    quantity: i.quantity,
  }));
}

/**
 * Devuelve las ruletas publicadas disponibles para proyectar.
 * Filtros opcionales por evento, tipo y nombre. Sin autenticación:
 * usa service role y solo expone configs con published = true.
 */
export async function getPublicWheels(filters?: {
  eventId?: string;
  mode?: string;
  wheelName?: string;
}) {
  const supabase = createAdminClient();
  let query = supabase
    .from("wheel_configs")
    .select("id, company_id, event_id, mode, wheel_name")
    .eq("published", true)
    .order("event_id")
    .order("mode")
    .order("wheel_name");

  if (filters?.eventId) query = query.eq("event_id", filters.eventId);
  if (filters?.mode) query = query.eq("mode", filters.mode);
  if (filters?.wheelName) query = query.eq("wheel_name", filters.wheelName);

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { data };
}

/**
 * Devuelve la config y segmentos de una ruleta PUBLICADA para la página
 * de proyección. No expone datos internos (solo labels/colores/card_number).
 */
export async function getPublicWheelData(wheelId: number) {
  const supabase = createAdminClient();

  const { data: cfg, error } = await supabase
    .from("wheel_configs")
    .select("id, company_id, event_id, mode, wheel_name, published")
    .eq("id", wheelId)
    .eq("published", true)
    .single();

  if (error || !cfg) return { error: "La ruleta no está disponible." };

  const segments = await buildSegments(supabase, cfg);
  return { data: { config: cfg, segments } };
}

/**
 * Gira la ruleta: selecciona el ganador en el servidor (randomInt criptográfico),
 * lo registra en wheel_spins y descuenta stock en modo Premios.
 * Solo opera sobre ruletas publicadas.
 */
export async function spinWheel(wheelId: number) {
  const supabase = createAdminClient();

  const { data: cfg, error } = await supabase
    .from("wheel_configs")
    .select("id, company_id, event_id, mode, wheel_name, published")
    .eq("id", wheelId)
    .eq("published", true)
    .single();

  if (error || !cfg) return { error: "La ruleta no está disponible." };

  const segments = await buildSegments(supabase, cfg);
  if (segments.length === 0) {
    return { error: "La ruleta no tiene segmentos disponibles." };
  }

  const winnerIndex = randomInt(0, segments.length);
  const winner = segments[winnerIndex];

  // Descuenta stock en modo Premios
  if (cfg.mode === "Premios" && winner.itemId) {
    const { data: item } = await supabase
      .from("wheel_items")
      .select("quantity")
      .eq("id", winner.itemId)
      .single();

    if (item && item.quantity > 0) {
      await supabase
        .from("wheel_items")
        .update({ quantity: item.quantity - 1 })
        .eq("id", winner.itemId);
    }
  }

  // Auditoría del giro
  await supabase.from("wheel_spins").insert({
    wheel_id: cfg.id,
    company_id: cfg.company_id,
    event_id: cfg.event_id,
    mode: cfg.mode,
    wheel_name: cfg.wheel_name,
    item_id: winner.itemId,
    winner_label: winner.label,
    card_number: winner.cardNumber ?? null,
    prize_label: cfg.mode === "Premios" ? winner.label : null,
    spun_by: null, // giro público
  });

  return {
    success: true,
    winnerIndex,
    winnerLabel: winner.label,
    cardNumber: winner.cardNumber ?? null,
    segments, // Enviamos los segmentos usados para sincronizar al cliente
  };
}
