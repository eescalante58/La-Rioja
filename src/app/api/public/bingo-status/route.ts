import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/public/bingo-status
 *
 * Estado público mínimo del Bingo para el sitio institucional:
 *   { success: true, data: { active: boolean } }
 *
 * "Activo" = existe un evento con `is_active = true` cuya fecha
 * (`event_date`) es hoy o posterior en hora de El Salvador. Los eventos
 * quedan marcados activos tras celebrarse hasta que el admin los cierra,
 * por eso también se exige la fecha.
 *
 * La tabla `events` no es legible por `anon` (RLS), así que se consulta con
 * el cliente service role y solo se expone un booleano. La respuesta se
 * cachea 5 min en el CDN: la usa el menú móvil de todas las páginas públicas.
 */
export async function GET() {
  const todaySV = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/El_Salvador",
  });

  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .gte("event_date", todaySV);

  if (error) {
    return NextResponse.json(
      { success: false, error: "No se pudo consultar el estado del Bingo." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: true, data: { active: (count ?? 0) > 0 } },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
