import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkCardsRangeCore } from "@/app/admin/bingo/invoice-core";
import { checkAdmin } from "../../check-admin";

/**
 * POST /api/bingo/cards/check-range
 * Body: { companyId, eventId, start, end }
 *
 * Verifica disponibilidad de un rango de cartones para el botón
 * [Verificar] de Nueva Factura. La consulta usa el índice único
 * (company_id, event_id, card_number) de cards y responde solo JSON —
 * sin el re-render RSC que hacía lenta la Server Action equivalente.
 */
const rangeSchema = z.object({
  companyId: z.number().int().positive(),
  eventId: z.string().min(1),
  start: z.number().int().min(1),
  end: z.number().int().min(1),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "JSON inválido" },
      { status: 400 },
    );
  }

  const parsed = rangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Parámetros inválidos" },
      { status: 400 },
    );
  }
  const { companyId, eventId, start, end } = parsed.data;

  const auth = await checkAdmin(companyId);
  if ("error" in auth) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status },
    );
  }

  const result = await checkCardsRangeCore(companyId, eventId, start, end);
  return NextResponse.json(result);
}
