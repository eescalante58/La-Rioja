import { NextRequest, NextResponse } from "next/server";
import { getNextAutoInvoiceNumberCore } from "@/app/admin/bingo/invoice-core";
import { checkAdmin } from "../../check-admin";

/**
 * GET /api/bingo/invoices/next-number?companyId=&eventId=
 *
 * Devuelve el siguiente correlativo "FactAut-NNNNNN" del evento sin
 * pasar por Server Actions (ver /api/bingo/invoices).
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

  const result = await getNextAutoInvoiceNumberCore(companyId, eventId);
  if ((result as any).error) {
    return NextResponse.json(
      { success: false, error: (result as any).error },
      { status: 500 },
    );
  }
  return NextResponse.json({ success: true, data: (result as any).data });
}
