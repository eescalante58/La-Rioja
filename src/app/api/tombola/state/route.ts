import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/tombola/state?id=<wheel_id>
 *
 * Estado público de la tómbola para espectadores:
 *   { participants: number[], winners: number[] }
 *
 * Pensado para polling con audiencias grandes (1000+ navegadores):
 * la respuesta se cachea en el CDN de Vercel ~2s (s-maxage), así cientos
 * de clientes colapsan en ~1 consulta a la BD cada 2 segundos en vez de
 * una conexión Realtime por navegador.
 */
export async function GET(request: NextRequest) {
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
    const { data: cfg, error } = await supabase
      .from("wheel_configs")
      .select("id, published, mode")
      .eq("id", wheelId)
      .eq("published", true)
      .single();

    if (error || !cfg) {
      return NextResponse.json(
        { success: false, error: "La tómbola no está disponible." },
        { status: 404 },
      );
    }

    const { data: cards, error: cardsError } = await supabase
      .from("wheel_participating_cards")
      .select("card_number, is_winner, updated_at, won_at")
      .eq("wheel_id", cfg.id);

    if (cardsError) throw cardsError;

    const list = (cards || []) as {
      card_number: number;
      is_winner: boolean;
      updated_at: string;
      won_at: string | null;
    }[];

    // Ganadores en orden de sorteo (won_at = momento del giro;
    // updated_at puede cambiar al registrar datos del ganador)
    const drawTime = (c: { won_at: string | null; updated_at: string }) =>
      new Date(c.won_at ?? c.updated_at).getTime();

    return NextResponse.json(
      {
        success: true,
        participants: list
          .filter((c) => !c.is_winner)
          .sort((a, b) => a.card_number - b.card_number)
          .map((c) => c.card_number),
        winners: list
          .filter((c) => c.is_winner)
          .sort((a, b) => drawTime(a) - drawTime(b))
          .map((c) => c.card_number),
      },
      {
        headers: {
          // Caché en CDN: espectadores toleran ~2s de desfase
          "Cache-Control": "public, s-maxage=2, stale-while-revalidate=4",
        },
      },
    );
  } catch (err: unknown) {
    console.error("Error fetching tombola state:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
