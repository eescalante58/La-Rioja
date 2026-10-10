import { createClient, createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getErrorMessage, singleRelation } from "@/lib/utils";
import type { Tables } from "@/types/database";
import { roleLevelOf } from "@/lib/auth/authorization";

type Invoice = Tables<"invoices">;
type Card = Tables<"cards">;

/** Contacto reciente mostrado en "Actividad reciente". */
export type RecentContact = Pick<Tables<"contact_submissions">, "id" | "name" | "created_at">;

/** Factura reciente mostrada en "Actividad reciente". */
export type RecentInvoice = Pick<
  Invoice,
  | "id"
  | "invoice_number"
  | "customer_name"
  | "cards_number"
  | "total_amount"
  | "created_at"
  | "status"
  | "invoice_date"
>;

/** Ventas pagadas agregadas por fecha de factura. */
export interface DailySale {
  date: string;
  total: number;
  count: number;
  cards: number;
}

/** Ventas acumuladas por año (eventos activos o cerrados). */
export interface YearlySale {
  year: string;
  total: number;
}

/** Cliente del ranking "Clientes con más Cartones". */
export interface TopCustomer {
  customer_name: string;
  cards: number;
  amount: number;
}

/** Datos de la vista principal del dashboard (`getDashboardDataCore`). */
export interface DashboardData {
  success: boolean;
  error?: string;
  companyId?: string;
  companyName?: string | null;
  hasEvent?: boolean;
  eventId?: string;
  eventName?: string | null;
  eventDate?: string | null;
  cardValue?: number;
  goal?: number;
  realized?: number;
  percentage?: number;
  dailySales?: DailySale[];
  yearlySales?: YearlySale[];
  topCustomers?: TopCustomer[];
  stats?: {
    cmsCount: number;
    customersCount: number;
    reportedCardsCount?: number;
  };
  recentContacts?: RecentContact[];
  recentInvoices?: RecentInvoice[];
  userLevel?: number;
}

/** Cartón auto-registrado en /registro (drill-down "Cartones Reportados"). */
export type RegisteredCard = Pick<
  Tables<"wheels_presents_cards">,
  | "id"
  | "card_number"
  | "player_name"
  | "player_phone_number"
  | "wheel_name"
  | "is_winner"
  | "created_at"
>;

/** Factura del drill-down "Ventas del día" (`getInvoicesByDateCore`). */
export type DateInvoice = Pick<
  Invoice,
  | "invoice_number"
  | "customer_name"
  | "total_amount"
  | "manager_name"
  | "payment_method"
  | "cards_number"
>;

/** Agrupación vendedor/método/precio de `getSalesSummaryByDateCore`. */
export interface SalesSummaryGroup {
  manager_name: string;
  payment_method: string;
  card_price: number;
  invoices_count: number;
  cards_number: number;
  total_amount: number;
}

/** Factura del detalle de una agrupación (`getInvoicesByDateGroupCore`). */
export type GroupInvoice = Pick<
  Invoice,
  | "invoice_number"
  | "invoice_date"
  | "customer_name"
  | "phone_area"
  | "phone_number"
  | "manager_name"
  | "payment_method"
  | "cards_number"
  | "card_price"
  | "total_amount"
>;

/** Total vendido por gestor (`getSalesByManagerCore`). */
export interface ManagerBreakdown {
  name: string;
  value: number;
}

/** Factura de un gestor o de un cliente (drill-downs del dashboard). */
export type CustomerInvoice = Pick<
  Invoice,
  | "invoice_number"
  | "invoice_date"
  | "customer_name"
  | "phone_area"
  | "phone_number"
  | "whatsapp_number"
  | "cards_number"
  | "card_price"
  | "total_amount"
>;

/** Alumno embebido en `students_cards(students(...))`. */
export type InvoiceCardStudent = Pick<Tables<"students">, "student_name" | "student_level">;

/**
 * Cartón de una factura con el alumno asignado (`getInvoiceCardsCore`).
 * `students` es many-to-one: llega como objeto, pero el cliente sin tipos
 * de esquema lo infiere como arreglo; leerlo con `singleRelation`.
 */
export type InvoiceCard = Pick<
  Card,
  "card_number" | "card_type" | "card_status" | "player_name" | "player_phone_number"
> & {
  students_cards: { students: InvoiceCardStudent | InvoiceCardStudent[] | null }[] | null;
};

/** Conteo y total por tipo/estado de cartón (`getCardTypeSummaryCore`). */
export interface CardTypeSummary {
  card_type: string;
  card_status: string;
  count: number;
  total: number;
}

/** Conteo y total por precio de venta/estado (`getCardPriceSummaryCore`). */
export interface CardPriceSummary {
  sales_price: number;
  card_status: string;
  count: number;
  total: number;
}

/** Alumno con sus totales dentro de un nivel (`getAssignmentByLevelCore`). */
export interface LevelStudent {
  id: number;
  name: string;
  level: string | null;
  assigned: number;
  sold: number;
  card_count: number;
}

/** Nivel de alumnos con subtotales de asignación y venta. */
export interface LevelAssignment {
  level: string;
  subtotal_assigned: number;
  subtotal_sold: number;
  subtotal_cards: number;
  students: LevelStudent[];
}

/** Cartón asignado a un alumno (`getStudentCardsCore`). */
export type StudentCard = Pick<
  Card,
  | "card_number"
  | "card_type"
  | "card_status"
  | "player_name"
  | "player_phone_number"
  | "invoice_number"
>;

/** País para los selectores de teléfono (`getBingoCountriesCore`). */
export type BingoCountry = Pick<
  Tables<"country_codes">,
  "name" | "phone_code" | "flag_emoji" | "iso2"
>;

/** Cliente del directorio de teléfonos (`getCustomersCore`). */
export type Customer = Tables<"customer_phone_number">;

/** Respuesta estándar de las funciones core: `data` solo cuando `success`. */
export interface CoreResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type AssignmentCard = Pick<Card, "card_price" | "sales_price" | "card_status">;

/** Cartón embebido en `students_cards(cards(...))` (many-to-one: ver `singleRelation`). */
interface AssignmentCardRow {
  cards: AssignmentCard | AssignmentCard[] | null;
}

/** Alumno con sus asignaciones (`getAssignmentByLevelCore`). */
type StudentAssignmentRow = Pick<
  Tables<"students">,
  "student_id" | "student_name" | "student_level"
> & {
  students_cards: AssignmentCardRow | AssignmentCardRow[] | null;
};

/**
 * Lógica del dashboard /admin compartida entre las Server Actions de
 * /admin/actions.ts (carga inicial SSR) y el Route Handler
 * /api/dashboard (refrescos del cliente).
 *
 * Las Server Actions llamadas desde el cliente re-renderizan el RSC
 * payload completo de la página; el Route Handler responde solo JSON.
 */

/** Lee la empresa seleccionada de la cookie de sesión. */
async function getSelectedCompanyId() {
  const cookieStore = await cookies();
  return cookieStore.get("selected_company_id")?.value;
}

/**
 * Fetches dashboard data for the selected company and its default event.
 * @returns {Promise<DashboardData>} Dashboard statistics and event data.
 */
export async function getDashboardDataCore(): Promise<DashboardData> {
  const supabaseAdmin = createAdminClient(); // For data
  const supabase = await createClient(); // For user session
  const companyId = await getSelectedCompanyId();

  if (!companyId) {
    return { success: false, error: "No company selected" };
  }

  // Get current user role using the client that knows about cookies
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userLevel = 0;
  if (user) {
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("roles:role_id (level)")
      .eq("id", user.id)
      .single();
    userLevel = roleLevelOf(userData);
  }

  try {
    // 1. Fetch company info and general stats in parallel
    const [companyRes, cmsRes, customersRes, contactsRes, allEventsRes, recentInvoicesRes] =
      await Promise.all([
        supabaseAdmin
          .from("companies")
          .select("def_dash_event_id, company_name")
          .eq("company_id", companyId)
          .single(),
        supabaseAdmin.from("site_content").select("*", { count: "exact", head: true }),
        supabaseAdmin
          .from("customer_phone_number")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId),
        supabaseAdmin
          .from("contact_submissions")
          .select("id, name, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabaseAdmin
          .from("events")
          .select("event_date, total_amount_solded, event_id, is_active, status")
          .eq("company_id", companyId),
        supabaseAdmin
          .from("invoices")
          .select(
            "id, invoice_number, customer_name, cards_number, total_amount, created_at, status, invoice_date",
          )
          .eq("company_id", companyId)
          .order("created_at", { ascending: false, nullsFirst: false })
          .limit(10),
      ]);

    const { data: company, error: companyError } = companyRes;
    const { count: cmsCount } = cmsRes;
    const { count: customersCount } = customersRes;
    const { data: recentContacts, error: contactError } = contactsRes;
    const { data: allEvents, error: allEventsError } = allEventsRes;
    const { data: recentInvoices, error: recentInvoicesError } = recentInvoicesRes;

    if (companyError || !company) {
      console.error("Error fetching company dash settings:", companyError);
      return { success: false, error: "Company settings not found" };
    }

    if (contactError) {
      console.error("Error fetching recent contact submissions:", contactError);
    }

    if (allEventsError) {
      console.error("Error fetching events for yearly sales:", allEventsError);
    }

    if (recentInvoicesError) {
      console.error("Error fetching recent invoices:", recentInvoicesError);
    }

    const eventId = company.def_dash_event_id;

    if (!eventId) {
      return {
        success: true,
        companyId,
        companyName: company.company_name,
        hasEvent: false,
        stats: {
          cmsCount: cmsCount || 0,
          customersCount: customersCount || 0,
        },
        recentContacts: recentContacts || [],
        recentInvoices: recentInvoices || [],
      };
    }

    // 2. Fetch event-specific data in parallel
    const [eventRes, invoicesRes, dailySalesRes, reportedCardsRes] = await Promise.all([
      supabaseAdmin
        .from("events")
        .select("event_name, event_date, event_goal, card_value, event_id")
        .eq("event_id", eventId)
        .eq("company_id", companyId)
        .single(),
      supabaseAdmin
        .from("invoices")
        .select("total_amount")
        .eq("event_id", eventId)
        .eq("company_id", companyId)
        .eq("status", "pagada"),
      supabaseAdmin
        .from("invoices")
        .select("invoice_date, total_amount, cards_number, customer_name")
        .eq("event_id", eventId)
        .eq("company_id", companyId)
        .eq("status", "pagada")
        .order("invoice_date", { ascending: true }),
      // Cartones auto-registrados por asistentes en /registro
      // (tómbolas modo Participantes del evento del dashboard)
      supabaseAdmin
        .from("wheels_presents_cards")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("event_id", eventId),
    ]);

    const { data: event, error: eventError } = eventRes;
    const { data: invoices, error: invoicesError } = invoicesRes;
    const { data: dailySales, error: dailySalesError } = dailySalesRes;
    const { count: reportedCardsCount } = reportedCardsRes;

    if (eventError || !event) {
      console.error("Error fetching event details:", eventError);
      return { success: false, error: "Event details not found" };
    }

    if (invoicesError) {
      console.error("Error fetching invoices:", invoicesError);
      return { success: false, error: "Error calculating sales" };
    }

    if (dailySalesError) {
      console.error("Error fetching daily sales:", dailySalesError);
    }

    // Process results
    const realized = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;
    const goal = Number(event.event_goal || 0);
    const percentage = goal > 0 ? (realized / goal) * 100 : 0;

    const paidInvoices: Pick<
      Invoice,
      "invoice_date" | "total_amount" | "cards_number" | "customer_name"
    >[] = dailySales ?? [];
    const eventsForYears: Pick<
      Tables<"events">,
      "event_date" | "total_amount_solded" | "event_id" | "is_active" | "status"
    >[] = allEvents ?? [];

    const dailySalesMap = paidInvoices.reduce<Record<string, Omit<DailySale, "date">>>(
      (acc, inv) => {
        const date = inv.invoice_date;
        if (!acc[date]) {
          acc[date] = { total: 0, count: 0, cards: 0 };
        }
        acc[date].total += Number(inv.total_amount || 0);
        acc[date].count += 1;
        acc[date].cards += Number(inv.cards_number || 0);
        return acc;
      },
      {},
    );

    const dailySalesData: DailySale[] = Object.keys(dailySalesMap).map((date) => ({
      date,
      total: dailySalesMap[date].total,
      count: dailySalesMap[date].count,
      cards: dailySalesMap[date].cards,
    }));

    const yearlySalesMap = eventsForYears.reduce<Record<string, number>>((acc, ev) => {
      let year = "";
      if (ev.event_date) {
        year = new Date(ev.event_date).getUTCFullYear().toString();
      } else if (ev.event_id && ev.event_id.length >= 4) {
        // Fallback: extract year from event_id prefix (YYYYMMDD...)
        const possibleYear = ev.event_id.substring(0, 4);
        if (/^\d{4}$/.test(possibleYear)) {
          year = possibleYear;
        }
      }

      if (!year) return acc;

      // Include if active OR if it's inactive and "Cerrado" as per user request
      const shouldInclude = ev.is_active || ev.status === "Cerrado";
      if (!shouldInclude) return acc;

      acc[year] = (acc[year] || 0) + Number(ev.total_amount_solded || 0);
      return acc;
    }, {});

    // Ranking de clientes por cartones comprados (facturas pagadas del
    // evento): nombre, total de cartones y valor acumulado. Ordenado
    // descendente por cantidad de cartones.
    const customersMap = paidInvoices.reduce<Record<string, TopCustomer>>((acc, inv) => {
      const name = (inv.customer_name || "").trim();
      if (!name) return acc;
      if (!acc[name]) {
        acc[name] = { customer_name: name, cards: 0, amount: 0 };
      }
      acc[name].cards += Number(inv.cards_number || 0);
      acc[name].amount += Number(inv.total_amount || 0);
      return acc;
    }, {});
    const topCustomers = Object.values(customersMap)
      .sort((a, b) => b.cards - a.cards || b.amount - a.amount)
      .slice(0, 10);

    const yearlySalesData: YearlySale[] = Object.keys(yearlySalesMap)
      .map((year) => ({
        year,
        total: yearlySalesMap[year],
      }))
      .sort((a, b) => b.year.localeCompare(a.year)); // Newer years first as in the image

    return {
      success: true,
      companyId,
      companyName: company.company_name,
      hasEvent: true,
      eventId: event.event_id,
      eventName: event.event_name,
      eventDate: event.event_date,
      cardValue: Number(event.card_value || 10), // Assuming card_value exists or default to 10
      goal,
      realized,
      percentage,
      dailySales: dailySalesData,
      yearlySales: yearlySalesData,
      topCustomers,
      stats: {
        cmsCount: cmsCount || 0,
        customersCount: customersCount || 0,
        reportedCardsCount: reportedCardsCount || 0,
      },
      recentContacts: recentContacts || [],
      recentInvoices: recentInvoices || [],
      userLevel,
    };
  } catch (error) {
    console.error("Unexpected error in getDashboardData:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Obtiene el timeout de sesión configurado para la empresa actualmente seleccionada.
 */
export async function getSessionTimeoutCore() {
  const companyId = await getSelectedCompanyId();
  if (!companyId) return { success: false, error: "No company selected" };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select("session_timeout_minutes")
    .eq("company_id", companyId)
    .single();

  if (error || !data) {
    return { success: false, error: error?.message || "Company not found" };
  }

  return { success: true, timeout_minutes: data.session_timeout_minutes || 30 };
}

/**
 * Lista los cartones auto-registrados por asistentes en /registro
 * (wheels_presents_cards) para el evento del dashboard (Drill down de la
 * tarjeta "Cartones Reportados"). El id de la fila es el folio que el
 * asistente recibe como código de registro.
 */
export async function getRegisteredCardsCore(): Promise<CoreResult<RegisteredCard[]>> {
  const supabase = createAdminClient();
  const companyId = await getSelectedCompanyId();

  if (!companyId) return { success: false, error: "No company" };

  const { data: company } = await supabase
    .from("companies")
    .select("def_dash_event_id")
    .eq("company_id", companyId)
    .single();

  const eventId = company?.def_dash_event_id;
  if (!eventId) return { success: true, data: [] };

  const { data, error } = await supabase
    .from("wheels_presents_cards")
    .select("id, card_number, player_name, player_phone_number, wheel_name, is_winner, created_at")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

/**
 * Fetches invoice details for a specific date (Drill down).
 */
export async function getInvoicesByDateCore(date: string): Promise<CoreResult<DateInvoice[]>> {
  const supabase = createAdminClient();
  const companyId = await getSelectedCompanyId();

  if (!companyId) return { success: false, error: "No company" };

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "invoice_number, customer_name, total_amount, manager_name, payment_method, cards_number",
    )
    .eq("company_id", companyId)
    .eq("invoice_date", date)
    .eq("status", "pagada")
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

/**
 * Resumen de ventas de una fecha puntual del evento del dashboard
 * (drill-down de la fecha del evento en la tarjeta "Avance de Ventas").
 * Agrupa las facturas pagadas de esa fecha por vendedor
 * (manager_name), método de pago (payment_method) y precio del cartón
 * (card_price): conteo de facturas, total de cartones y monto acumulado.
 */
export async function getSalesSummaryByDateCore(
  date: string,
): Promise<CoreResult<SalesSummaryGroup[]>> {
  const supabase = createAdminClient();
  const companyId = await getSelectedCompanyId();

  if (!companyId) return { success: false, error: "No company" };

  const { data: company } = await supabase
    .from("companies")
    .select("def_dash_event_id")
    .eq("company_id", companyId)
    .single();

  if (!company?.def_dash_event_id) return { success: false, error: "No event" };

  const { data, error } = await supabase
    .from("invoices")
    .select("manager_name, payment_method, cards_number, card_price, total_amount")
    .eq("company_id", companyId)
    .eq("event_id", company.def_dash_event_id)
    .eq("invoice_date", date)
    .eq("status", "pagada");

  if (error) return { success: false, error: error.message };

  const grouped = new Map<
    string,
    {
      manager_name: string;
      payment_method: string;
      card_price: number;
      invoices_count: number;
      cards_number: number;
      total_amount: number;
    }
  >();
  for (const inv of data || []) {
    const manager = (inv.manager_name || "").trim() || "Sin asignar";
    const method = (inv.payment_method || "").trim() || "N/D";
    const price = Number(inv.card_price || 0);
    const key = `${manager}|${method}|${price}`;
    const g = grouped.get(key) ?? {
      manager_name: manager,
      payment_method: method,
      card_price: price,
      invoices_count: 0,
      cards_number: 0,
      total_amount: 0,
    };
    g.invoices_count += 1;
    g.cards_number += Number(inv.cards_number || 0);
    g.total_amount += Number(inv.total_amount || 0);
    grouped.set(key, g);
  }

  const rows = [...grouped.values()].sort((a, b) => b.total_amount - a.total_amount);
  return { success: true, data: rows };
}

/**
 * Detalle de facturas de una agrupación del resumen de ventas por fecha
 * (drill-down del vendedor en el modal "Ventas del día del evento").
 * Filtra en JS con la misma normalización usada al agrupar
 * (manager/method trim con fallback "Sin asignar"/"N/D", precio numérico)
 * para que la agrupación y su detalle siempre coincidan.
 */
export async function getInvoicesByDateGroupCore(
  date: string,
  manager: string,
  method: string,
  price: number,
): Promise<CoreResult<GroupInvoice[]>> {
  const supabase = createAdminClient();
  const companyId = await getSelectedCompanyId();

  if (!companyId) return { success: false, error: "No company" };

  const { data: company } = await supabase
    .from("companies")
    .select("def_dash_event_id")
    .eq("company_id", companyId)
    .single();

  if (!company?.def_dash_event_id) return { success: false, error: "No event" };

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "invoice_number, invoice_date, customer_name, phone_area, phone_number, manager_name, payment_method, cards_number, card_price, total_amount",
    )
    .eq("company_id", companyId)
    .eq("event_id", company.def_dash_event_id)
    .eq("invoice_date", date)
    .eq("status", "pagada")
    .order("invoice_number", { ascending: true });

  if (error) return { success: false, error: error.message };

  const norm = (v: unknown, fallback: string) => String(v ?? "").trim() || fallback;
  return {
    success: true,
    data: (data || []).filter(
      (inv) =>
        norm(inv.manager_name, "Sin asignar") === manager &&
        norm(inv.payment_method, "N/D") === method &&
        Number(inv.card_price || 0) === price,
    ),
  };
}

/**
 * Fetches sales breakdown by manager for the current event (Drill down).
 */
export async function getSalesByManagerCore(): Promise<CoreResult<ManagerBreakdown[]>> {
  const supabase = createAdminClient();
  const companyId = await getSelectedCompanyId();

  if (!companyId) return { success: false, error: "No company" };

  const { data: company } = await supabase
    .from("companies")
    .select("def_dash_event_id")
    .eq("company_id", companyId)
    .single();

  if (!company?.def_dash_event_id) return { success: false, error: "No event" };

  const { data, error } = await supabase
    .from("invoices")
    .select("manager_name, total_amount")
    .eq("company_id", companyId)
    .eq("event_id", company.def_dash_event_id)
    .eq("status", "pagada");

  if (error) return { success: false, error: error.message };

  // Group by manager
  const managerInvoices: Pick<Invoice, "manager_name" | "total_amount">[] = data ?? [];
  const breakdownMap = managerInvoices.reduce<Record<string, number>>((acc, inv) => {
    const name = inv.manager_name || "Sin asignar";
    acc[name] = (acc[name] || 0) + Number(inv.total_amount || 0);
    return acc;
  }, {});

  const breakdownData: ManagerBreakdown[] = Object.keys(breakdownMap)
    .map((name) => ({
      name,
      value: breakdownMap[name],
    }))
    .sort((a, b) => b.value - a.value);

  return { success: true, data: breakdownData };
}

/**
 * Fetches invoice details for a specific manager in the current event
 * (Drill down from "Ventas por Vendedor").
 */
export async function getInvoicesByManagerCore(
  managerName: string,
): Promise<CoreResult<CustomerInvoice[]>> {
  const supabase = createAdminClient();
  const companyId = await getSelectedCompanyId();

  if (!companyId) return { success: false, error: "No company" };

  const { data: company } = await supabase
    .from("companies")
    .select("def_dash_event_id")
    .eq("company_id", companyId)
    .single();

  if (!company?.def_dash_event_id) return { success: false, error: "No event" };

  let query = supabase
    .from("invoices")
    .select(
      "invoice_number, invoice_date, customer_name, phone_area, phone_number, whatsapp_number, cards_number, card_price, total_amount",
    )
    .eq("company_id", companyId)
    .eq("event_id", company.def_dash_event_id)
    .eq("status", "pagada");

  query =
    managerName === "Sin asignar"
      ? query.is("manager_name", null)
      : query.eq("manager_name", managerName);

  const { data, error } = await query.order("customer_name", {
    ascending: true,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

/**
 * Facturas pagadas de un cliente en el evento del dashboard
 * (drill-down de "Clientes con más Cartones"). El nombre llega
 * normalizado desde la agregación del ranking; se compara en JS por
 * trim+lowercase para no depender de espacios/mayúsculas del registro.
 */
export async function getInvoicesByCustomerCore(
  customerName: string,
): Promise<CoreResult<CustomerInvoice[]>> {
  const supabase = createAdminClient();
  const companyId = await getSelectedCompanyId();

  if (!companyId) return { success: false, error: "No company" };

  const { data: company } = await supabase
    .from("companies")
    .select("def_dash_event_id")
    .eq("company_id", companyId)
    .single();

  if (!company?.def_dash_event_id) return { success: false, error: "No event" };

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "invoice_number, invoice_date, customer_name, phone_area, phone_number, whatsapp_number, cards_number, card_price, total_amount",
    )
    .eq("company_id", companyId)
    .eq("event_id", company.def_dash_event_id)
    .eq("status", "pagada")
    .order("invoice_date", { ascending: false });

  if (error) return { success: false, error: error.message };

  const target = customerName.trim().toLowerCase();
  return {
    success: true,
    data: (data || []).filter((inv) => (inv.customer_name || "").trim().toLowerCase() === target),
  };
}

/**
 * Fetches the cards linked to an invoice, including the assigned student
 * (if any) via students_cards -> students.
 */
export async function getInvoiceCardsCore(
  invoiceNumber: string,
): Promise<CoreResult<InvoiceCard[]>> {
  const supabase = await createClient();
  const companyId = await getSelectedCompanyId();

  if (!companyId) return { success: false, error: "No company" };

  const { data: company } = await supabase
    .from("companies")
    .select("def_dash_event_id")
    .eq("company_id", companyId)
    .single();

  if (!company?.def_dash_event_id) return { success: false, error: "No event" };

  const { data, error } = await supabase
    .from("cards")
    .select(
      "card_number, card_type, card_status, player_name, player_phone_number, students_cards(students(student_name, student_level))",
    )
    .eq("company_id", companyId)
    .eq("event_id", company.def_dash_event_id)
    .eq("invoice_number", invoiceNumber)
    .order("card_number", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

/**
 * Resumen de cartones por tipo y estado para el evento por defecto:
 * conteo y suma de sales_price por cada combinación tipo/estado.
 */
export async function getCardTypeSummaryCore(): Promise<CoreResult<CardTypeSummary[]>> {
  const supabase = createAdminClient();
  const companyId = await getSelectedCompanyId();

  if (!companyId) return { success: false, error: "No company" };

  const { data: company } = await supabase
    .from("companies")
    .select("def_dash_event_id")
    .eq("company_id", companyId)
    .single();

  if (!company?.def_dash_event_id) return { success: false, error: "No event" };

  // Paginar: el evento puede superar el límite de 1000 filas por consulta
  const pageSize = 1000;
  const rows: Pick<Card, "card_type" | "card_status" | "sales_price">[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data: page, error } = await supabase
      .from("cards")
      .select("card_type, card_status, sales_price")
      .eq("company_id", companyId)
      .eq("event_id", company.def_dash_event_id)
      .order("card_number", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) return { success: false, error: error.message };
    rows.push(...(page || []));
    if (!page || page.length < pageSize) break;
  }

  const grouped = new Map<string, { count: number; total: number }>();
  for (const c of rows) {
    const key = `${c.card_type || "—"}|${c.card_status || "—"}`;
    const g = grouped.get(key) || { count: 0, total: 0 };
    g.count++;
    g.total += Number(c.sales_price || 0);
    grouped.set(key, g);
  }

  const data = [...grouped.entries()]
    .map(([key, g]) => {
      const [card_type, card_status] = key.split("|");
      return { card_type, card_status, count: g.count, total: g.total };
    })
    .sort(
      (a, b) =>
        a.card_type.localeCompare(b.card_type) || a.card_status.localeCompare(b.card_status),
    );

  return { success: true, data };
}

/**
 * Resumen por precio de venta (sales_price) de los cartones 'Vendido' y
 * 'Donado' del evento por defecto: conteo y total por combinación
 * precio/estado. Sirve para ver cuántos cartones se vendieron a cada
 * precio (descuentos, precios especiales, donados).
 */
export async function getCardPriceSummaryCore(): Promise<CoreResult<CardPriceSummary[]>> {
  const supabase = createAdminClient();
  const companyId = await getSelectedCompanyId();

  if (!companyId) return { success: false, error: "No company" };

  const { data: company } = await supabase
    .from("companies")
    .select("def_dash_event_id")
    .eq("company_id", companyId)
    .single();

  if (!company?.def_dash_event_id) return { success: false, error: "No event" };

  // Paginar: el evento puede superar el límite de 1000 filas por consulta
  const pageSize = 1000;
  const rows: Pick<Card, "card_status" | "sales_price">[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data: page, error } = await supabase
      .from("cards")
      .select("card_status, sales_price")
      .eq("company_id", companyId)
      .eq("event_id", company.def_dash_event_id)
      .in("card_status", ["Vendido", "Donado"])
      .order("card_number", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) return { success: false, error: error.message };
    rows.push(...(page || []));
    if (!page || page.length < pageSize) break;
  }

  const grouped = new Map<string, { count: number; total: number }>();
  for (const c of rows) {
    const key = `${Number(c.sales_price || 0)}|${c.card_status || "—"}`;
    const g = grouped.get(key) || { count: 0, total: 0 };
    g.count++;
    g.total += Number(c.sales_price || 0);
    grouped.set(key, g);
  }

  const data = [...grouped.entries()]
    .map(([key, g]) => {
      const [price, card_status] = key.split("|");
      return {
        sales_price: Number(price),
        card_status,
        count: g.count,
        total: g.total,
      };
    })
    .sort((a, b) => b.sales_price - a.sales_price || a.card_status.localeCompare(b.card_status));

  return { success: true, data };
}

/**
 * Fetches card assignments by level and student for the current event.
 */
export async function getAssignmentByLevelCore(): Promise<CoreResult<LevelAssignment[]>> {
  const supabase = createAdminClient(); // Faster admin query
  const companyId = await getSelectedCompanyId();

  if (!companyId) return { success: false, error: "No company selected" };

  const { data: company } = await supabase
    .from("companies")
    .select("def_dash_event_id")
    .eq("company_id", companyId)
    .single();

  if (!company?.def_dash_event_id) return { success: false, error: "No event" };

  // Join students with students_cards and cards
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      student_id,
      student_name,
      student_level,
      students_cards(
        cards(
          card_price,
          sales_price,
          card_status
        )
      )
    `,
    )
    .eq("company_id", companyId)
    .eq("event_id", company.def_dash_event_id);

  if (error) return { success: false, error: error.message };

  // Group by level
  const levelsMap = new Map<string, LevelAssignment>();
  const students: StudentAssignmentRow[] = data ?? [];

  for (const student of students) {
    const levelName = student.student_level || "Sin nivel";
    const levelData: LevelAssignment = levelsMap.get(levelName) || {
      level: levelName,
      subtotal_assigned: 0,
      subtotal_sold: 0,
      subtotal_cards: 0,
      students: [],
    };

    let studentAssigned = 0;
    let studentSold = 0;
    let studentCards = 0;

    const assignments: AssignmentCardRow[] = Array.isArray(student.students_cards)
      ? student.students_cards
      : student.students_cards
        ? [student.students_cards]
        : [];

    for (const sc of assignments) {
      const card = singleRelation(sc.cards);
      if (card) {
        studentCards++;
        studentAssigned += Number(card.card_price || 0);
        if (card.card_status === "Vendido") {
          studentSold += Number(card.sales_price || 0);
        }
      }
    }

    levelData.subtotal_assigned += studentAssigned;
    levelData.subtotal_sold += studentSold;
    levelData.subtotal_cards += studentCards;

    levelData.students.push({
      id: student.student_id,
      name: student.student_name,
      level: student.student_level,
      assigned: studentAssigned,
      sold: studentSold,
      card_count: studentCards,
    });

    levelsMap.set(levelName, levelData);
  }

  // Sort levels and students
  const result = [...levelsMap.values()]
    .sort((a, b) => a.level.localeCompare(b.level))
    .map((level) => ({
      ...level,
      students: level.students.sort((a, b) => a.name.localeCompare(b.name)),
    }));

  return { success: true, data: result };
}

/**
 * Fetches the cards assigned to a specific student in the current event.
 */
export async function getStudentCardsCore(studentId: number): Promise<CoreResult<StudentCard[]>> {
  const supabase = createAdminClient();
  const companyId = await getSelectedCompanyId();

  if (!companyId) return { success: false, error: "No company selected" };

  const { data: company } = await supabase
    .from("companies")
    .select("def_dash_event_id")
    .eq("company_id", companyId)
    .single();

  if (!company?.def_dash_event_id) return { success: false, error: "No event" };

  // First get the card numbers from students_cards
  const { data: assignments, error: scError } = await supabase
    .from("students_cards")
    .select("card_number")
    .eq("company_id", companyId)
    .eq("event_id", company.def_dash_event_id)
    .eq("student_id", studentId);

  if (scError) return { success: false, error: scError.message };
  if (!assignments || assignments.length === 0) return { success: true, data: [] };

  const cardNumbers = (assignments as Pick<Tables<"students_cards">, "card_number">[]).map(
    (a) => a.card_number,
  );

  // Then get the full card details
  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select("card_number, card_type, card_status, player_name, player_phone_number, invoice_number")
    .eq("company_id", companyId)
    .eq("event_id", company.def_dash_event_id)
    .in("card_number", cardNumbers)
    .order("card_number", { ascending: true });

  if (cardsError) return { success: false, error: cardsError.message };
  return { success: true, data: cards };
}

/**
 * Fetches country codes for phone selects.
 */
export async function getBingoCountriesCore(): Promise<CoreResult<BingoCountry[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("country_codes")
    .select("name, phone_code, flag_emoji, iso2")
    .order("name", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

/** Clientes de la empresa (directorio de teléfonos). */
export async function getCustomersCore(companyId: number): Promise<CoreResult<Customer[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_phone_number")
    .select("*")
    .eq("company_id", companyId)
    .order("customer_name");

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
