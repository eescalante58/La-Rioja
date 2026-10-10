import { NextRequest, NextResponse } from "next/server";
import {
  getEventCardsCore,
  getCardsForInvoiceCore,
} from "@/app/admin/bingo/invoice-core";
import { checkAdmin } from "../check-admin";

/**
 * GET /api/bingo/cards?companyId=&eventId=[&invoice=]
 *
 * Sin `invoice`: inventario completo del evento (paginado en servidor,
 * lo usa la edición de factura y el tab de inventario).
 * Con `invoice`: solo los cartones vinculados a esa factura (popup de
 * WhatsApp). JSON puro, sin re-render RSC.
 */
export async function GET(request: NextRequest) {
  const companyId = Number(request.nextUrl.searchParams.get("companyId"));
  const eventId = request.nextUrl.searchParams.get("eventId") || "";
  const invoice = request.nextUrl.searchParams.get("invoice") || "";

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

  const result = invoice
    ? await getCardsForInvoiceCore(companyId, eventId, invoice)
    : await getEventCardsCore(companyId, eventId);

  if ("error" in result && result.error) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 },
    );
  }
  return NextResponse.json(result);
}
