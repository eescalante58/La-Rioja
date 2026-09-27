import { NextRequest, NextResponse } from "next/server";
import { getSellersCore } from "@/app/admin/bingo/invoice-core";
import { checkAdmin } from "../check-admin";

/**
 * GET /api/bingo/sellers?companyId=&eventId=
 *
 * Lista de vendedores del evento para el datalist del formulario de
 * factura. JSON puro (sin re-render RSC como en las Server Actions).
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

  const result = await getSellersCore(companyId, eventId);
  return NextResponse.json(result);
}
