import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * /api/tombola/winners — datos de ganadores para el monitor del staff.
 *
 *   GET  ?id=<wheel_id>  → config + participantes + ganadores con datos
 *                          registrados (orden de captura primero).
 *   POST { wheelId, cardNumber, winnerName, winnerPrize, documentType,
 *          documentNumber, winnerPhoneNumber }
 *                        → registra/actualiza los datos del ganador.
 *                          Valida que el cartón sea ganador del sorteo.
 *
 * Es público porque /tombola/monitor se proyecta sin login. Sin caché:
 * el staff necesita el dato exacto en vivo (Realtime dispara el refetch).
 */

const DOCUMENT_TYPES = [
  "DUI",
  "Pasaporte",
  "NIT",
  "Carnet de Residente",
] as const;

const registerSchema = z.object({
  wheelId: z.number().int().positive(),
  cardNumber: z.number().int().positive(),
  winnerName: z.string().trim().min(2).max(120),
  winnerPrize: z.string().trim().max(120).optional().nullable(),
  documentType: z.enum(DOCUMENT_TYPES).default("DUI"),
  documentNumber: z.string().trim().min(4).max(30),
  winnerPhoneNumber: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{6,19}$/, "Teléfono inválido")
    .max(20),
});

interface WinnerRow {
  card_number: number;
  is_winner: boolean;
  updated_at: string;
  won_at: string | null;
  winner_name: string | null;
  winner_prize: string | null;
  document_type: string | null;
  document_number: string | null;
  winner_phone_number: string | null;
  winner_registered_at: string | null;
}

/**
 * GET /api/tombola/winners?id=<wheel_id>
 * Estado completo para el monitor: ganadores con sus datos en orden de
 * captura (winner_registered_at), los pendientes de registrar al final
 * por orden de sorteo (won_at).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wheelId = parseInt(searchParams.get("id") || "");

  if (!Number.isFinite(wheelId)) {
    return NextResponse.json(
      { success: false, error: "ID de tómbola requerido" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  try {
    const { data: cfg, error } = await supabase
      .from("wheel_configs")
      .select("id, company_id, event_id, mode, wheel_name, time_rotation")
      .eq("id", wheelId)
      .eq("published", true)
      .single();

    if (error || !cfg || cfg.mode === "Premios") {
      return NextResponse.json(
        { success: false, error: "La tómbola no está disponible." },
        { status: 404 },
      );
    }

    const { data: evt } = await supabase
      .from("events")
      .select("event_name")
      .eq("company_id", cfg.company_id)
      .eq("event_id", cfg.event_id)
      .single();

    const { data: cards, error: cardsError } = await supabase
      .from("wheel_participating_cards")
      .select(
        "card_number, is_winner, updated_at, won_at, winner_name, winner_prize, document_type, document_number, winner_phone_number, winner_registered_at",
      )
      .eq("wheel_id", cfg.id);

    if (cardsError) throw cardsError;

    const list = (cards || []) as WinnerRow[];
    const drawTime = (c: WinnerRow) =>
      new Date(c.won_at ?? c.updated_at).getTime();
    const captureTime = (c: WinnerRow) =>
      c.winner_registered_at
        ? new Date(c.winner_registered_at).getTime()
        : Infinity;

    // Orden de captura: con datos primero (por registered_at), luego
    // los pendientes por orden de sorteo.
    const winners = list
      .filter((c) => c.is_winner)
      .sort((a, b) => {
        const captureDiff = captureTime(a) - captureTime(b);
        return captureDiff !== 0 ? captureDiff : drawTime(a) - drawTime(b);
      })
      .map((c) => ({
        cardNumber: c.card_number,
        wonAt: c.won_at ?? c.updated_at,
        winnerName: c.winner_name,
        winnerPrize: c.winner_prize,
        documentType: c.document_type,
        documentNumber: c.document_number,
        winnerPhoneNumber: c.winner_phone_number,
        registeredAt: c.winner_registered_at,
      }));

    return NextResponse.json(
      {
        success: true,
        config: {
          id: cfg.id,
          wheel_name: cfg.wheel_name,
          event_id: cfg.event_id,
          event_name: evt?.event_name || cfg.event_id,
          mode: cfg.mode,
          time_rotation: cfg.time_rotation || 5,
        },
        participants: list
          .filter((c) => !c.is_winner)
          .sort((a, b) => a.card_number - b.card_number)
          .map((c) => c.card_number),
        winners,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err: unknown) {
    console.error("Error fetching tombola winners:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tombola/winners
 * Registra (o corrige) los datos de un cartón ganador. Valida que el
 * cartón exista en esa ruleta y que ya haya sido sorteado (is_winner).
 * winner_registered_at fija el orden de captura en el monitor.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "JSON inválido" },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message || "Datos inválidos",
      },
      { status: 400 },
    );
  }

  const {
    wheelId,
    cardNumber,
    winnerName,
    winnerPrize,
    documentType,
    documentNumber,
    winnerPhoneNumber,
  } = parsed.data;

  const supabase = createAdminClient();

  try {
    const { data: cfg, error } = await supabase
      .from("wheel_configs")
      .select("id, mode")
      .eq("id", wheelId)
      .eq("published", true)
      .single();

    if (error || !cfg || cfg.mode === "Premios") {
      return NextResponse.json(
        { success: false, error: "La tómbola no está disponible." },
        { status: 404 },
      );
    }

    // Validación clave: el cartón debe participar y ser ganador
    const { data: card, error: cardError } = await supabase
      .from("wheel_participating_cards")
      .select("id, winner_registered_at")
      .eq("wheel_id", cfg.id)
      .eq("card_number", cardNumber)
      .eq("is_winner", true)
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        {
          success: false,
          error: `El cartón #${cardNumber} no es un cartón ganador de esta tómbola.`,
        },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabase
      .from("wheel_participating_cards")
      .update({
        winner_name: winnerName,
        winner_prize: winnerPrize || null,
        document_type: documentType,
        document_number: documentNumber,
        winner_phone_number: winnerPhoneNumber,
        // Solo fija la posición de captura la primera vez; las
        // correcciones posteriores conservan su lugar en la lista.
        winner_registered_at:
          card.winner_registered_at ?? new Date().toISOString(),
      })
      .eq("id", card.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, cardNumber });
  } catch (err: unknown) {
    console.error("Error registering tombola winner:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
