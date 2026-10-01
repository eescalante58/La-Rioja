import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { randomInt, createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Interface for wheel segments.
 */
interface WheelSegment {
  itemId: number | null;
  label: string;
  color: string | null;
  cardNumber?: number;
  quantity?: number;
  /** false = segmento sin derecho a premio (modo Premios). */
  isPrize?: boolean;
}

/**
 * Builds the segments for the wheel based on its mode.
 * Optimized for low latency.
 */
async function buildSegments(
  supabase: SupabaseClient,
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

    return (data || []).map((c: { card_number: number }) => ({
      itemId: null,
      label: `#${c.card_number}`,
      color: null,
      cardNumber: c.card_number,
    }));
  }

  let query = supabase
    .from("wheel_items")
    .select("id, label, color, quantity, is_prize")
    .eq("wheel_id", cfg.id)
    .eq("is_active", true)
    .order("position", { ascending: true, nullsFirst: false })
    .order("id");

  // En Premios participan segmentos con stock > 0, más los segmentos
  // sin premio (is_prize=false), que no usan stock.
  if (cfg.mode === "Premios") {
    query = query.or("quantity.gt.0,is_prize.eq.false");
  }

  const { data } = await query;
  return (data || []).map((i: { id: number; label: string; color: string | null; quantity: number; is_prize: boolean }) => ({
    itemId: i.id,
    label: i.label,
    color: i.color,
    quantity: i.quantity,
    isPrize: i.is_prize !== false,
  }));
}

/**
 * POST /api/wheel/spin?id=<wheel_id>
 * 
 * Performs a cryptographically secure spin on the server.
 * This route handler is used instead of a Server Action to avoid RSC re-rendering
 * and achieve near-zero latency for live events.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wheelIdStr = searchParams.get("id");
  
  if (!wheelIdStr) {
    return NextResponse.json({ success: false, error: "ID de ruleta requerido" }, { status: 400 });
  }

  const wheelId = parseInt(wheelIdStr);
  const supabase = createAdminClient();

  try {
    // 1. Fetch wheel config
    const { data: cfg, error } = await supabase
      .from("wheel_configs")
      .select("*")
      .eq("id", wheelId)
      .eq("published", true)
      .single();

    if (error || !cfg) {
      return NextResponse.json({ success: false, error: "La ruleta no está disponible o no está publicada." }, { status: 404 });
    }

    const prizesNumber = cfg.prizes_number ?? 0;
    const { count: awardedPrizesCount } = await supabase
      .from("wheel_spins")
      .select("id", { count: "exact", head: true })
      .eq("wheel_id", cfg.id)
      .not("prize_label", "is", null);

    if (prizesNumber > 0 && (awardedPrizesCount ?? 0) >= prizesNumber) {
      return NextResponse.json(
        {
          success: false,
          finished: true,
          error: `La ruleta ya completó los ${prizesNumber} premios configurados.`,
          spinsCount: awardedPrizesCount ?? 0,
          prizesNumber,
        },
        { status: 400 },
      );
    }

    // 2. Build segments
    const segments = await buildSegments(supabase, cfg);
    if (segments.length === 0) {
      return NextResponse.json({ success: false, error: "La ruleta no tiene segmentos disponibles." }, { status: 400 });
    }

    // En Premios, si solo quedan segmentos sin derecho a premio el
    // sorteo terminó aunque no se haya alcanzado prizes_number.
    if (cfg.mode === "Premios" && segments.every((s) => s.isPrize === false)) {
      return NextResponse.json(
        {
          success: false,
          finished: true,
          error: "Sorteo finalizado — ya no quedan premios en la ruleta.",
          spinsCount: awardedPrizesCount ?? 0,
          prizesNumber,
        },
        { status: 400 },
      );
    }

    // 3. Select winner + decremento de stock ATOMICO (CAS):
    // el UPDATE exige que quantity siga en el valor leido; si otro giro
    // simultaneo lo altero, se descarta el segmento y se re-selecciona.
    let winner: WheelSegment | null = null;
    let winnerIndex = -1;

    for (let attempt = 0; attempt < 3 && !winner; attempt++) {
      let idx = 0;
      if (cfg.mode === "Premios") {
        // Algoritmo de Suma Acumulada para probabilidad ponderada por stock.
        // Un premio con stock 10 tiene 10x mas probabilidad que uno con stock 1.
        // Los segmentos sin premio (isPrize=false) reciben peso 1 para mantener presencia.
        const weights = segments.map((s) => (s.isPrize === false ? 1 : (s.quantity || 0)));
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        if (totalWeight > 0) {
          let randomWeight = randomInt(0, totalWeight);
          for (let i = 0; i < weights.length; i++) {
            if (randomWeight < weights[i]) {
              idx = i;
              break;
            }
            randomWeight -= weights[i];
          }
        } else {
          idx = randomInt(0, segments.length);
        }
      } else {
        // Probabilidad uniforme para Cartones / Participantes (todos 1 chance)
        idx = randomInt(0, segments.length);
      }

      const picked = segments[idx];

      // Decremento atomico solo en segmentos con premio (los sin premio no usan stock)
      if (cfg.mode === "Premios" && picked.itemId && picked.isPrize !== false) {
        const currentQty = picked.quantity || 0;
        const { data: decremented, error: decError } = await supabase
          .from("wheel_items")
          .update({ quantity: currentQty - 1 })
          .eq("id", picked.itemId)
          .eq("quantity", currentQty)
          .gt("quantity", 0)
          .select("quantity");

        if (decError) throw decError;

        if (!decremented || decremented.length === 0) {
          // Carrera: otro giro agoto/altero el stock — quitar el segmento
          // de la vista local y re-seleccionar con datos consistentes.
          segments.splice(idx, 1);
          if (segments.length === 0) {
            return NextResponse.json(
              { success: false, finished: true, error: "Sorteo finalizado — ya no quedan premios en la ruleta." },
              { status: 400 },
            );
          }
          continue;
        }
        picked.quantity = decremented[0].quantity;
      }

      winner = picked;
      winnerIndex = segments.indexOf(picked);
    }

    if (!winner) {
      return NextResponse.json(
        { success: false, error: "No fue posible completar el giro. Intenta de nuevo.", retry: true },
        { status: 409 },
      );
    }

    const spunAt = new Date().toISOString();
    
    // Determinar si el giro otorga un premio real. 
    // En modo Premios, depende de la bandera is_prize del segmento.
    // En otros modos (Cartones/Participantes), cada giro es un ganador.
    const isPrize = cfg.mode !== "Premios" || winner.isPrize !== false;
    const prizeLabel = isPrize ? winner.label : null;

    // Generar Hash de Verificación para auditoría reforzada (integridad).
    // El hash incluye datos del giro y un salt secreto para evitar falsificaciones.
    const salt = process.env.WHEEL_SALT || "larioja-secret-salt-2026";
    const hashData = `${cfg.id}|${winner.itemId}|${winner.label}|${winner.cardNumber}|${spunAt}|${salt}`;
    const verificationHash = createHash("sha256").update(hashData).digest("hex");

    // 4. Auditoría del giro. Si el trigger de prizes_number rechaza un giro
    // concurrente, se restaura el stock descontado (compensacion CAS).
    const { error: auditError } = await supabase.from("wheel_spins").insert({
      wheel_id: cfg.id,
      company_id: cfg.company_id,
      event_id: cfg.event_id,
      mode: cfg.mode,
      wheel_name: cfg.wheel_name,
      item_id: winner.itemId,
      winner_label: winner.label,
      card_number: winner.cardNumber ?? null,
      prize_label: prizeLabel,
      spun_by: null, // Public spin
      spun_at: spunAt,
      verification_hash: verificationHash,
    });

    if (auditError) {
      // Compensar el stock: volver a sumar solo si sigue en el valor
      // que dejo nuestro decremento (nadie mas lo toco entre medio).
      if (cfg.mode === "Premios" && winner.itemId && winner.isPrize !== false) {
        const { error: restoreError } = await supabase
          .from("wheel_items")
          .update({ quantity: (winner.quantity ?? -1) + 1 })
          .eq("id", winner.itemId)
          .eq("quantity", winner.quantity ?? -1);
        if (restoreError) {
          console.error(`No se pudo restaurar stock del item ${winner.itemId}:`, restoreError);
        }
      }
      const finished = auditError.code === "23514";
      return NextResponse.json(
        {
          success: false,
          finished,
          error: auditError.message,
          spinsCount: finished ? prizesNumber : (awardedPrizesCount ?? 0),
          prizesNumber,
        },
        { status: 400 },
      );
    }

    // El stock ya quedo descontado atomicamente durante la seleccion (paso 3).

    return NextResponse.json({
      success: true,
      winnerIndex,
      winnerLabel: winner.label,
      cardNumber: winner.cardNumber ?? null,
      itemId: winner.itemId,
      segments, // Devolvemos los segmentos usados en el giro con el stock actualizado
      spinsCount: isPrize ? (awardedPrizesCount ?? 0) + 1 : (awardedPrizesCount ?? 0),
      prizesNumber,
    });
  } catch (err: unknown) {
    console.error("Error spinning wheel in API:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
