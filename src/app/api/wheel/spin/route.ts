import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { randomInt } from "node:crypto";

/**
 * Interface for wheel segments.
 */
interface WheelSegment {
  itemId: number | null;
  label: string;
  color: string | null;
  cardNumber?: number;
  quantity?: number;
}

/**
 * Builds the segments for the wheel based on its mode.
 * Optimized for low latency.
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
      .select("id, company_id, event_id, mode, wheel_name, published")
      .eq("id", wheelId)
      .eq("published", true)
      .single();

    if (error || !cfg) {
      return NextResponse.json({ success: false, error: "La ruleta no está disponible o no está publicada." }, { status: 404 });
    }

    // 2. Build segments
    const segments = await buildSegments(supabase, cfg);
    if (segments.length === 0) {
      return NextResponse.json({ success: false, error: "La ruleta no tiene segmentos disponibles." }, { status: 400 });
    }

    // 3. Select winner
    const winnerIndex = randomInt(0, segments.length);
    const winner = segments[winnerIndex];

    // 4. Update state and audit (in parallel where possible)
    const auditPromise = supabase.from("wheel_spins").insert({
      wheel_id: cfg.id,
      company_id: cfg.company_id,
      event_id: cfg.event_id,
      mode: cfg.mode,
      wheel_name: cfg.wheel_name,
      item_id: winner.itemId,
      winner_label: winner.label,
      card_number: winner.cardNumber ?? null,
      prize_label: cfg.mode === "Premios" ? winner.label : null,
      spun_by: null, // Public spin
    });

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

    await auditPromise;

    return NextResponse.json({
      success: true,
      winnerIndex,
      winnerLabel: winner.label,
      cardNumber: winner.cardNumber ?? null,
      segments,
    });
  } catch (err: any) {
    console.error("Error spinning wheel in API:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
