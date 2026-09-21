import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { requireCompanyAccess } from "@/lib/auth/authorization";

/**
 * GET /api/invoice?n=<invoice_number>
 *
 * Returns a single invoice plus its associated card numbers.
 *
 * Implemented as a Route Handler instead of a Server Action: server actions
 * force Next.js to re-render the page's full RSC payload on every call
 * (re-running all dashboard data fetches), which made each invoice
 * consultation take tens of seconds. A route handler returns plain JSON.
 */
export async function GET(request: NextRequest) {
  const invoiceNumber = request.nextUrl.searchParams.get("n")?.trim() || "";
  if (!invoiceNumber) {
    return NextResponse.json(
      { success: false, error: "Número de factura requerido" },
      { status: 400 },
    );
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

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("company_id", companyId)
    .eq("event_id", company.def_dash_event_id)
    .eq("invoice_number", invoiceNumber)
    .single();

  if (error) {
    console.error(`Error fetching invoice ${invoiceNumber}:`, error);
    return NextResponse.json({ success: false, error: error.message });
  }

  if (!invoice) {
    return NextResponse.json({ success: false, error: "Factura no encontrada" });
  }

  // Associated cards (indexed by idx_cards_invoice_number)
  // Use the invoice's own company_id and event_id for accuracy
  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select("card_number")
    .eq("invoice_number", invoiceNumber)
    .eq("company_id", invoice.company_id)
    .eq("event_id", invoice.event_id);

  if (cardsError) {
    console.error(`Error fetching cards for invoice ${invoiceNumber}:`, cardsError);
  }

  const associated_cards = (cards || []).map((c) => Number(c.card_number));
  console.log(`[API /api/invoice] ${invoiceNumber}: found ${associated_cards.length} cards:`, associated_cards);

  return NextResponse.json({
    success: true,
    data: {
      ...invoice,
      associated_cards,
    },
  });
}
