import { NextRequest, NextResponse } from "next/server";
import {
  getWhatsAppMessageTemplateCore,
  updateInvoiceWhatsAppStatusCore,
  sendWhatsAppAutomationCore,
} from "@/app/admin/bingo/whatsapp-core";
import { checkAdmin } from "../check-admin";

/**
 * /api/bingo/whatsapp — flujo de envío posterior a la venta.
 *
 * Route Handler a propósito (JSON puro, sin re-render RSC de
 * /admin/bingo). El envío automático exige rol 6 como la Server Action
 * original; plantilla y marcado de estado exigen rol 4.
 *
 *   GET  ?view=template&companyId=          → plantilla activa
 *   POST { action:"send",   companyId, to, message, templateImage?,
 *          invoiceUrl?, cardUrls[] }        → envío Ultramsg (rol 6)
 *   POST { action:"status", companyId,
 *          invoiceId, status }              → marca send_whatsapp_message
 */
export async function GET(request: NextRequest) {
  const view = request.nextUrl.searchParams.get("view") || "";
  const companyId = Number(request.nextUrl.searchParams.get("companyId"));

  if (!Number.isInteger(companyId) || companyId <= 0 || view !== "template") {
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

  const result = await getWhatsAppMessageTemplateCore();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "JSON inválido" },
      { status: 400 },
    );
  }

  const companyId = Number(body?.companyId);
  const action = body?.action;
  if (!Number.isInteger(companyId) || companyId <= 0) {
    return NextResponse.json(
      { success: false, error: "companyId inválido" },
      { status: 400 },
    );
  }

  if (action === "send") {
    // Envío automático Ultramsg: mismo piso de rol (6) que la acción original
    const auth = await checkAdmin(companyId, 6);
    if ("error" in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status },
      );
    }

    const result = await sendWhatsAppAutomationCore({
      to: String(body.to || ""),
      message: String(body.message || ""),
      templateImage: body.templateImage || undefined,
      invoiceUrl: body.invoiceUrl || undefined,
      cardUrls: Array.isArray(body.cardUrls) ? body.cardUrls : [],
    });
    return NextResponse.json(result);
  }

  if (action === "status") {
    const auth = await checkAdmin(companyId);
    if ("error" in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status },
      );
    }

    const result = await updateInvoiceWhatsAppStatusCore(
      String(body.invoiceId || ""),
      String(body.status || ""),
      auth.user?.id,
    );
    return NextResponse.json(result);
  }

  return NextResponse.json(
    { success: false, error: "Acción no soportada" },
    { status: 400 },
  );
}
