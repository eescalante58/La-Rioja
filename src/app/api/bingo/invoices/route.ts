import { NextRequest, NextResponse } from "next/server";
import {
  getInvoicesCore,
  saveInvoiceCore,
  updateInvoiceCore,
  deleteInvoiceCore,
} from "@/app/admin/bingo/invoice-core";
import { checkAdmin } from "../check-admin";

/**
 * /api/bingo/invoices — facturación del evento (operaciones admin).
 *
 * Route Handler a propósito: las Server Actions de /admin/bingo
 * re-renderizan la página completa como parte de su respuesta (~minutos
 * en producción), inaceptable durante la cola de ventas del evento.
 * Este endpoint responde solo JSON.
 *
 *   GET    ?companyId=&eventId=   → lista de facturas del evento
 *   POST   multipart/form-data    → crea factura y marca sus cartones
 *   PUT    multipart/form-data    → actualiza factura y re-vincula cartones
 *   DELETE ?id=&companyId=        → elimina factura y libera sus cartones
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

  const result = await getInvoicesCore(companyId, eventId);
  if ((result as any).error) {
    return NextResponse.json(
      { success: false, error: (result as any).error },
      { status: 500 },
    );
  }
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "FormData inválido" },
      { status: 400 },
    );
  }

  const companyId = Number(formData.get("company_id"));
  if (!Number.isInteger(companyId) || companyId <= 0) {
    return NextResponse.json(
      { success: false, error: "company_id inválido" },
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

  const result = await saveInvoiceCore(formData, auth.user!.id);
  if ((result as any)?.error) {
    return NextResponse.json(
      { success: false, error: (result as any).error },
      { status: 400 },
    );
  }
  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "FormData inválido" },
      { status: 400 },
    );
  }

  const companyId = Number(formData.get("company_id"));
  if (!Number.isInteger(companyId) || companyId <= 0 || !formData.get("id")) {
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

  const result = await updateInvoiceCore(formData, auth.user!.id);
  if ((result as any)?.error) {
    return NextResponse.json(
      { success: false, error: (result as any).error },
      { status: 400 },
    );
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "";
  const companyId = Number(request.nextUrl.searchParams.get("companyId"));

  if (!id || !Number.isInteger(companyId) || companyId <= 0) {
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

  const result = await deleteInvoiceCore(id, auth.user?.id);
  if ((result as any)?.error) {
    return NextResponse.json(
      { success: false, error: (result as any).error },
      { status: 400 },
    );
  }
  return NextResponse.json({ success: true });
}
