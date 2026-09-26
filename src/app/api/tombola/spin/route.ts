import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { randomInt } from "node:crypto";

interface ParticipatingCard {
  id: number;
  card_number: number;
}

/**
 * POST /api/tombola/spin?id=<wheel_id>
 *
 * Sorteo de tómbola con latencia cero para eventos en vivo:
 * 1. Lee los cartones participantes (is_winner = false) de la ruleta publicada.
 * 2. Elige ganador con randomInt criptográfico en el servidor.
 * 3. Marca is_winner = true de forma ATÓMICA (WHERE is_winner = false):
 *    si dos operadores giran a la vez, solo uno gana ese cartón.
 * 4. Audita en wheel_spins (misma tabla que la ruleta).
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wheelIdStr = searchParams.get("id");

  if (!wheelIdStr) {
    return NextResponse.json(
      { success: false, error: "ID de tómbola requerido" },
      { status: 400 },
    );
  }

  const wheelId = parseInt(wheelIdStr);
  const supabase = createAdminClient();

  try {
    // 1. Config de la ruleta (debe estar publicada y ser de tómbola)
    const { data: cfg, error } = await supabase
      .from("wheel_configs")
      .select("*")
      .eq("id", wheelId)
      .eq("published", true)
      .single();

    if (error || !cfg) {
      return NextResponse.json(
        { success: false, error: "La tómbola no está disponible o no está publicada." },
        { status: 404 },
      );
    }
    if (cfg.mode === "Premios") {
      return NextResponse.json(
        { success: false, error: "Esta ruleta no es de tómbola." },
        { status: 400 },
      );
    }

    const prizesNumber = cfg.prizes_number ?? 0;
    const { count: winnerCount } = await supabase
      .from("wheel_participating_cards")
      .select("id", { count: "exact", head: true })
      .eq("wheel_id", cfg.id)
      .eq("is_winner", true);

    if (prizesNumber > 0 && (winnerCount ?? 0) >= prizesNumber) {
      return NextResponse.json(
        {
          success: false,
          finished: true,
          error: `La tómbola ya completó los ${prizesNumber} premios configurados.`,
          winnerCount: winnerCount ?? 0,
          prizesNumber,
        },
        { status: 400 },
      );
    }

    // 2. Cartones aún no ganadores
    const { data: participants, error: partError } = await supabase
      .from("wheel_participating_cards")
      .select("id, card_number")
      .eq("wheel_id", cfg.id)
      .eq("is_winner", false)
      .order("card_number");

    if (partError) throw partError;
    if (!participants || participants.length === 0) {
      return NextResponse.json(
        { success: false, error: "No hay cartones participantes disponibles." },
        { status: 400 },
      );
    }

    // 3. Ganador aleatorio seguro (servidor)
    const winner =
      (participants as ParticipatingCard[])[
        randomInt(0, participants.length)
      ];

    // 4. Marcado atómico: solo si sigue sin ser ganador (anti doble-giro).
    // won_at fija el orden de sorteo (updated_at lo mueve set_timestamps
    // al registrar datos del ganador). Fallback sin won_at por si la
    // migración 20261004000000 aún no se aplicó en producción.
    let { data: marked, error: markError } = await supabase
      .from("wheel_participating_cards")
      .update({ is_winner: true, won_at: new Date().toISOString() })
      .eq("id", winner.id)
      .eq("is_winner", false)
      .select("id");

    if (markError) {
      const fallback = await supabase
        .from("wheel_participating_cards")
        .update({ is_winner: true })
        .eq("id", winner.id)
        .eq("is_winner", false)
        .select("id");
      marked = fallback.data;
      markError = fallback.error;
    }

    if (markError?.code === "23514") {
      return NextResponse.json(
        {
          success: false,
          finished: true,
          error: markError.message,
          winnerCount: prizesNumber,
          prizesNumber,
        },
        { status: 400 },
      );
    }
    if (markError) throw markError;
    if (!marked || marked.length === 0) {
      // Otro proceso lo ganó primero: reintentar una vez
      return NextResponse.json(
        { success: false, error: "El cartón ya fue sorteado. Intenta de nuevo.", retry: true },
        { status: 409 },
      );
    }

    // 5. Auditoría (mismo esquema que wheel_spins de la ruleta)
    const { error: auditError } = await supabase.from("wheel_spins").insert({
      wheel_id: cfg.id,
      company_id: cfg.company_id,
      event_id: cfg.event_id,
      mode: cfg.mode,
      wheel_name: cfg.wheel_name,
      item_id: null,
      winner_label: `Cartón #${winner.card_number}`,
      card_number: winner.card_number,
      prize_label: null,
      spun_by: null, // giro público
    });

    if (auditError) {
      // El ganador ya quedó marcado y validado por el trigger de tómbola;
      // se reporta el problema sin intentar revertir el sorteo.
      console.error("Error auditando giro de tómbola:", auditError);
    }

    return NextResponse.json({
      success: true,
      winnerCardNumber: winner.card_number,
      remainingCount: participants.length - 1,
      winnerCount: (winnerCount ?? 0) + 1,
      prizesNumber,
    });
  } catch (err: unknown) {
    console.error("Error spinning tombola in API:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
