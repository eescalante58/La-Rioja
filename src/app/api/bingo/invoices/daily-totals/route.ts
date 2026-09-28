import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdmin } from "../../check-admin";

/**
 * GET /api/bingo/invoices/daily-totals?companyId=&eventId=
 *
 * Totales del día para el tab "Ventas y Facturación": cantidad de
 * facturas, cartones vendidos y monto total cuya invoice_date es hoy
 * (fecha local de El Salvador). Solo trae 2 columnas por fila y resuelve
 * el filtro con idx_invoices_company_event_date — barato incluso en vivo.
 */
export async function GET(request: NextRequest) {
  const companyId = Number(request.nextUrl.searchParams.get("companyId"));
  const eventId = request.nextUrl.searchParams.get("eventId") || "";

  if (!Number.isInteger(companyId) || companyId <= 0 || !eventId) {
    return NextResponse.json(
      { success: false, error: "Parámetros inválidos" },
      { status: 400 },
    );
  }

  const auth = await checkAdmin(companyId);
  if ("error" in auth) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status },
    );
  }

  // "Hoy" en El Salvador (UTC-6): la fecha que el operador ve en la factura
  const todaySV = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/El_Salvador",
  });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("cards_number, total_amount")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .eq("invoice_date", todaySV);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  const rows = data || [];
  return NextResponse.json({
    success: true,
    data: {
      date: todaySV,
      invoices: rows.length,
      cards: rows.reduce((s, r) => s + (Number(r.cards_number) || 0), 0),
      total: rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0),
    },
  });
}
