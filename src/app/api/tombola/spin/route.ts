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
      .select("id, company_id, event_id, mode, wheel_name, published")
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

    // 4. Marcado atómico: solo si sigue sin ser ganador (anti doble-giro)
    const { data: marked, error: markError } = await supabase
      .from("wheel_participating_cards")
      .update({ is_winner: true })
      .eq("id", winner.id)
      .eq("is_winner", false)
      .select("id");

    if (markError) throw markError;
    if (!marked || marked.length === 0) {
      // Otro proceso lo ganó primero: reintentar una vez
      return NextResponse.json(
        { success: false, error: "El cartón ya fue sorteado. Intenta de nuevo.", retry: true },
        { status: 409 },
      );
    }

    // 5. Auditoría (mismo esquema que wheel_spins de la ruleta)
    await supabase.from("wheel_spins").insert({
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

    return NextResponse.json({
      success: true,
      winnerCardNumber: winner.card_number,
      remainingCount: participants.length - 1,
    });
  } catch (err: unknown) {
    console.error("Error spinning tombola in API:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
