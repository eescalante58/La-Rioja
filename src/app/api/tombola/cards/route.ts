import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireRoleLevel, requireCompanyAccess } from "@/lib/auth/authorization";

/**
 * /api/tombola/cards — gestión de cartones participantes de la tómbola (admin).
 *
 * Route Handler (no Server Action) a propósito: las Server Actions de Next.js
 * re-renderizan la página completa como parte de su respuesta, y /admin/bingo
 * es pesada (~minutos). Este endpoint responde solo JSON — la carga de ~262
 * cartones tarda ~1s en lugar de varios minutos.
 *
 *   GET    ?companyId=&wheelId=   → lista cartones (disponibles y ganadores)
 *   POST   { companyId, wheelId } → carga masiva desde cards 'Vendido'
 *   DELETE { companyId, cardId }  → quita un cartón no ganador
 */

const loadSchema = z.object({
  companyId: z.number().int().positive(),
  wheelId: z.number().int().positive(),
});

const deleteSchema = z.object({
  companyId: z.number().int().positive(),
  cardId: z.number().int().positive(),
});

/** Auth admin: nivel >= 4 y membresía en la empresa. */
async function checkAdmin(companyId: number) {
  const { error: roleError } = await requireRoleLevel(4);
  if (roleError) return { status: 401, error: roleError };

  const { authorized, error } = await requireCompanyAccess(companyId);
  if (!authorized) return { status: 403, error: error || "Acceso denegado" };
  return null;
}

/**
 * GET /api/tombola/cards?companyId=<n>&wheelId=<n>
 * Lista cartones participantes ordenados (no ganadores primero, luego por número).
 */
export async function GET(request: NextRequest) {
  const companyId = Number(request.nextUrl.searchParams.get("companyId"));
  const wheelId = Number(request.nextUrl.searchParams.get("wheelId"));

  const parsed = loadSchema.safeParse({ companyId, wheelId });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const authError = await checkAdmin(companyId);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const supabase = createAdminClient();

  // La tabla depende del modo: Participantes usa los registros de /registro
  const { data: cfg } = await supabase
    .from("wheel_configs")
    .select("mode")
    .eq("id", wheelId)
    .eq("company_id", companyId)
    .single();
  const table =
    cfg?.mode === "Participantes"
      ? "wheels_presents_cards"
      : "wheel_participating_cards";
  const selectCols =
    "id, card_number, is_winner" +
    (cfg?.mode === "Participantes" ? ", player_name, player_phone_number" : "");

  const { data, error } = await supabase
    .from(table)
    .select(selectCols)
    .eq("company_id", companyId)
    .eq("wheel_id", wheelId)
    .order("is_winner")
    .order("card_number");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

/** Tamaño de página para consultas grandes (PostgREST corta ~1000 filas). */
const PAGE_SIZE = 1000;

/**
 * POST /api/tombola/cards
 * Carga masiva: copia a wheel_participating_cards los cartones 'Vendido'
 * o 'Donado' del evento. Regla de rondas: un cartón que ya GANÓ en
 * cualquier tómbola del evento no puede volver a entrar (no gana en otra
 * ronda); los participantes no ganadores sí pueden repetir ronda. Las
 * filas existentes nunca se modifican ni resetean.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = loadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }
  const { companyId, wheelId } = parsed.data;

  const authError = await checkAdmin(companyId);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const supabase = createAdminClient();

  const { data: cfg, error: cfgError } = await supabase
    .from("wheel_configs")
    .select("id, company_id, event_id, mode, wheel_name")
    .eq("id", wheelId)
    .eq("company_id", companyId)
    .single();

  if (cfgError || !cfg) {
    return NextResponse.json({ error: "No se encontró la ruleta." }, { status: 404 });
  }
  if (cfg.mode === "Premios") {
    return NextResponse.json(
      { error: "La tómbola solo aplica a ruletas de Cartones o Participantes." },
      { status: 400 },
    );
  }
  if (cfg.mode === "Participantes") {
    // Los cartones Participantes los registran los asistentes desde
    // /registro — no se permite la carga masiva administrativa.
    return NextResponse.json(
      {
        error:
          "Las ruletas de Participantes se cargan desde el formulario público /registro, no por carga masiva.",
      },
      { status: 400 },
    );
  }

  // Cartones elegibles, paginados: el evento puede tener más de 1000 y
  // PostgREST aplicaría su límite por defecto truncando la carga.
  const soldCards: { card_number: number }[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error: cardsError } = await supabase
      .from("cards")
      .select("card_number")
      .eq("company_id", companyId)
      .eq("event_id", cfg.event_id)
      .in("card_status", ["Vendido", "Donado"])
      .range(from, from + PAGE_SIZE - 1);

    if (cardsError) {
      return NextResponse.json({ error: cardsError.message }, { status: 500 });
    }
    soldCards.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  if (soldCards.length === 0) {
    return NextResponse.json(
      { error: "No hay cartones vendidos ni donados en este evento." },
      { status: 400 },
    );
  }

  // Ganadores de CUALQUIER tómbola del mismo evento: quedan fuera de
  // esta ronda. Los cartones ya presentes en ESTA tómbola solo se
  // reportan (la inserción los ignora).
  const winners = new Set<number>();
  const inThisWheel = new Set<number>();
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error: existingError } = await supabase
      .from("wheel_participating_cards")
      .select("card_number, is_winner, wheel_id")
      .eq("company_id", companyId)
      .eq("event_id", cfg.event_id)
      .range(from, from + PAGE_SIZE - 1);

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 },
      );
    }
    for (const r of data ?? []) {
      if (r.is_winner) winners.add(r.card_number);
      if (r.wheel_id === wheelId) inThisWheel.add(r.card_number);
    }
    if (!data || data.length < PAGE_SIZE) break;
  }

  const eligible = soldCards.filter((c) => !winners.has(c.card_number));
  const skippedWinners = soldCards.length - eligible.length;
  const alreadyLoaded = eligible.filter((c) =>
    inThisWheel.has(c.card_number),
  ).length;
  const newCards = eligible.filter((c) => !inThisWheel.has(c.card_number));

  const rows = newCards.map((c) => ({
    wheel_id: cfg.id,
    company_id: companyId,
    event_id: cfg.event_id,
    mode: cfg.mode,
    wheel_name: cfg.wheel_name,
    card_number: c.card_number,
  }));

  // INSERT ... ON CONFLICT DO NOTHING (sin target): idempotente ante
  // cualquier restricción única — la compuesta con wheel_id y la única
  // por (company_id, event_id, card_number) — y jamás toca
  // is_winner/won_at de filas previas.
  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from("wheel_participating_cards")
      .upsert(rows, { ignoreDuplicates: true });

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  const { count } = await supabase
    .from("wheel_participating_cards")
    .select("id", { count: "exact", head: true })
    .eq("wheel_id", wheelId);

  return NextResponse.json({
    success: true,
    found: soldCards.length,
    skipped: soldCards.length - rows.length,
    skippedWinners,
    alreadyLoaded,
    loaded: rows.length,
    total: count ?? 0,
  });
}

/**
 * DELETE /api/tombola/cards
 * Quita un cartón de la tómbola. Solo si aún no es ganador.
 */
export async function DELETE(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }
  const { companyId, cardId } = parsed.data;

  const authError = await checkAdmin(companyId);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const supabase = createAdminClient();

  // El cardId solo existe en una de las dos tablas de participación;
  // el DELETE sobre la tabla que no lo contiene no elimina nada.
  const [partRes, presentsRes] = await Promise.all([
    supabase
      .from("wheel_participating_cards")
      .delete()
      .eq("id", cardId)
      .eq("company_id", companyId)
      .eq("is_winner", false),
    supabase
      .from("wheels_presents_cards")
      .delete()
      .eq("id", cardId)
      .eq("company_id", companyId)
      .eq("is_winner", false),
  ]);
  const error = partRes.error || presentsRes.error;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
