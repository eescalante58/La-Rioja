import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireCompanyAccess } from "@/lib/auth/authorization";
import {
  getDashboardDataCore,
  getRegisteredCardsCore,
  getInvoicesByDateCore,
  getSalesByManagerCore,
  getInvoicesByManagerCore,
  getInvoicesByCustomerCore,
  getInvoiceCardsCore,
  getCardTypeSummaryCore,
  getAssignmentByLevelCore,
  getStudentCardsCore,
  getBingoCountriesCore,
  getCustomersCore,
} from "@/app/admin/dashboard-core";

/**
 * GET /api/dashboard?view=<vista>[&date=&manager=&invoice=&studentId=]
 *
 * Refrescos del dashboard /admin (Realtime + drill-downs) en JSON puro.
 * Las Server Actions equivalentes re-renderizaban la página completa en
 * cada respuesta — inaceptable con la suscripción realtime activa.
 *
 * Guard: usuario autenticado + membresía en la empresa de la cookie
 * `selected_company_id` (mismo modelo implícito que las acciones
 * originales, que no exigían piso de rol).
 *
 * Vistas: data | registered-cards | invoices-by-date | sales-by-manager |
 * invoices-by-manager | invoices-by-customer | invoice-cards |
 * card-type-summary | assignment-by-level | student-cards | countries |
 * customers
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const view = params.get("view") || "";

  const cookieStore = await cookies();
  const companyId = cookieStore.get("selected_company_id")?.value;
  if (!companyId) {
    return NextResponse.json(
      { success: false, error: "No company selected" },
      { status: 400 },
    );
  }

  const access = await requireCompanyAccess(companyId);
  if (!access.authorized) {
    return NextResponse.json(
      { success: false, error: access.error || "Acceso denegado" },
      { status: access.error === "No autenticado" ? 401 : 403 },
    );
  }

  switch (view) {
    case "data":
      return NextResponse.json(await getDashboardDataCore());
    case "registered-cards":
      return NextResponse.json(await getRegisteredCardsCore());
    case "invoices-by-date": {
      const date = params.get("date") || "";
      if (!date) return badParams();
      return NextResponse.json(await getInvoicesByDateCore(date));
    }
    case "sales-by-manager":
      return NextResponse.json(await getSalesByManagerCore());
    case "invoices-by-manager": {
      const manager = params.get("manager");
      if (!manager) return badParams();
      return NextResponse.json(await getInvoicesByManagerCore(manager));
    }
    case "invoices-by-customer": {
      const customer = params.get("customer");
      if (!customer) return badParams();
      return NextResponse.json(await getInvoicesByCustomerCore(customer));
    }
    case "invoice-cards": {
      const invoice = params.get("invoice");
      if (!invoice) return badParams();
      return NextResponse.json(await getInvoiceCardsCore(invoice));
    }
    case "card-type-summary":
      return NextResponse.json(await getCardTypeSummaryCore());
    case "assignment-by-level":
      return NextResponse.json(await getAssignmentByLevelCore());
    case "student-cards": {
      const studentId = Number(params.get("studentId"));
      if (!Number.isInteger(studentId) || studentId <= 0) return badParams();
      return NextResponse.json(await getStudentCardsCore(studentId));
    }
    case "countries":
      return NextResponse.json(await getBingoCountriesCore());
    case "customers":
      return NextResponse.json(await getCustomersCore(Number(companyId)));
    default:
      return badParams();
  }
}

function badParams() {
  return NextResponse.json(
    { success: false, error: "Parámetros inválidos" },
    { status: 400 },
  );
}
