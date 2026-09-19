import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { requireCompanyAccess } from "@/lib/auth/authorization";

/**
 * GET /api/search?q=<termino>
 *
 * Universal search over invoices and cards via the `busqueda_universal`
 * Postgres RPC (FTS + trigram GIN indexes).
 *
 * Implemented as a Route Handler instead of a Server Action: server actions
 * force Next.js to re-render the page's full RSC payload on every call
 * (re-running all dashboard data fetches), which caused ~25s latency.
 * A route handler returns plain JSON only.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (query.length < 2) {
    return NextResponse.json({ success: true, results: [] });
  }

  const cookieStore = await cookies();
  const companyId = cookieStore.get("selected_company_id")?.value;
  if (!companyId) {
    return NextResponse.json(
      { success: false, error: "No company selected" },
      { status: 400 },
    );
  }

  // Auth: only authenticated users with membership in the selected company
  const { authorized, error: authError } = await requireCompanyAccess(companyId);
  if (!authorized) {
    return NextResponse.json(
      { success: false, error: authError || "No autorizado" },
      { status: 401 },
    );
  }

  const supabase = createAdminClient();

  const { data: company } = await supabase
    .from("companies")
    .select("def_dash_event_id")
    .eq("company_id", companyId)
    .single();

  if (!company?.def_dash_event_id) {
    return NextResponse.json({ success: false, error: "No event" });
  }

  const { data, error } = await supabase.rpc("busqueda_universal", {
    p_company_id: Number(companyId),
    p_event_id: company.def_dash_event_id,
    p_termino: query,
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message });
  }

  const rows = (data || []) as any[];

  // Enrich card hits with the fields used by the quick detail modal
  const cardRefs = rows
    .filter((r) => r.origen === "card")
    .map((r) => Number(r.ref))
    .filter((n) => !isNaN(n));

  let cardMap = new Map<number, any>();
  if (cardRefs.length > 0) {
    const { data: cardsData } = await supabase
      .from("cards")
      .select("card_number, player_name, card_status, card_type, invoice_number")
      .eq("company_id", companyId)
      .eq("event_id", company.def_dash_event_id)
      .in("card_number", cardRefs);
    cardMap = new Map((cardsData || []).map((c: any) => [c.card_number, c]));
  }

  const results = rows.map((r) => ({
    type: r.origen,
    id: r.ref,
    title: r.titulo,
    subtitle: r.subtitulo,
    details: r.detalle,
    raw: r.origen === "card" ? cardMap.get(Number(r.ref)) || r : r,
  }));

  return NextResponse.json({ success: true, results });
}
