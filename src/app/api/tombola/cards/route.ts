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
  const { data, error } = await supabase
    .from("wheel_participating_cards")
    .select("id, card_number, is_winner")
    .eq("company_id", companyId)
    .eq("wheel_id", wheelId)
    .order("is_winner")
    .order("card_number");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

/**
 * POST /api/tombola/cards
 * Carga masiva: copia a wheel_participating_cards todos los cartones con
 * card_status='Vendido' del evento de la ruleta. Upsert idempotente sobre la
 * llave (company_id, event_id, card_number): no duplica ni resetea ganadores.
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

  const { data: soldCards, error: cardsError } = await supabase
    .from("cards")
    .select("card_number")
    .eq("company_id", companyId)
    .eq("event_id", cfg.event_id)
    .eq("card_status", "Vendido");

  if (cardsError) {
    return NextResponse.json({ error: cardsError.message }, { status: 500 });
  }
  if (!soldCards || soldCards.length === 0) {
    return NextResponse.json(
      { error: "No hay cartones vendidos en este evento." },
      { status: 400 },
    );
  }

  const rows = (soldCards as { card_number: number }[]).map((c) => ({
    wheel_id: cfg.id,
    company_id: companyId,
    event_id: cfg.event_id,
    mode: cfg.mode,
    wheel_name: cfg.wheel_name,
    card_number: c.card_number,
  }));

  const { error: upsertError } = await supabase
    .from("wheel_participating_cards")
    .upsert(rows, {
      onConflict: "company_id,event_id,card_number",
      ignoreDuplicates: true,
    });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const { count } = await supabase
    .from("wheel_participating_cards")
    .select("id", { count: "exact", head: true })
    .eq("wheel_id", wheelId);

  return NextResponse.json({
    success: true,
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
  const { error } = await supabase
    .from("wheel_participating_cards")
    .delete()
    .eq("id", cardId)
    .eq("company_id", companyId)
    .eq("is_winner", false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
