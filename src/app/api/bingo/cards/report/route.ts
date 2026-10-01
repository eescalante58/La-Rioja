import { NextRequest, NextResponse } from "next/server";
import { getCardsStatusReportCore } from "@/app/admin/bingo/invoice-core";
import { checkAdmin } from "../../check-admin";

/**
 * GET /api/bingo/cards/report?companyId=&eventId=&status=&from=&to=
 *
 * Informe de cartones por estado dentro de un rango de números.
 * `status` admite un valor del enum card_status_enum o "Todos".
 * JSON puro `{ success, data | error }`; sin re-render RSC.
 */
export async function GET(request: NextRequest) {
  const companyId = Number(request.nextUrl.searchParams.get("companyId"));
  const eventId = request.nextUrl.searchParams.get("eventId") || "";
  const status = request.nextUrl.searchParams.get("status") || "Todos";
  const fromCard = Number(request.nextUrl.searchParams.get("from"));
  const toCard = Number(request.nextUrl.searchParams.get("to"));

  if (
    !Number.isInteger(companyId) ||
    companyId <= 0 ||
    !eventId ||
    !Number.isInteger(fromCard) ||
    !Number.isInteger(toCard) ||
    toCard < fromCard
  ) {
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

  const result = await getCardsStatusReportCore(
    companyId,
    eventId,
    status,
    fromCard,
    toCard,
  );

  if ((result as { error?: string }).error) {
    return NextResponse.json(
      { success: false, error: (result as { error?: string }).error },
      { status: 500 },
    );
  }
  return NextResponse.json(result);
}
