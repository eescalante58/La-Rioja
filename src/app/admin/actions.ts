"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * Fetches dashboard data for the selected company and its default event.
 * @returns {Promise<any>} Dashboard statistics and event data.
 */
export async function getDashboardData() {
  const supabaseAdmin = createAdminClient(); // For data
  const supabase = await createClient(); // For user session
  const cookieStore = await cookies();
  const companyId = cookieStore.get("selected_company_id")?.value;

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
    userLevel = (userData?.roles as any)?.level || 0;
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
        supabaseAdmin
          .from("site_content")
          .select("*", { count: "exact", head: true }),
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
          .select(
            "event_date, total_amount_solded, event_id, is_active, status",
          )
          .eq("company_id", companyId),
        supabaseAdmin
          .from("invoices")
          .select("id, invoice_number, customer_name, cards_number, total_amount, created_at, status, invoice_date")
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
    const [eventRes, invoicesRes, dailySalesRes] = await Promise.all([
      supabaseAdmin
        .from("events")
        .select("event_name, event_goal, card_value, event_id")
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
        .select("invoice_date, total_amount")
        .eq("event_id", eventId)
        .eq("company_id", companyId)
        .eq("status", "pagada")
        .order("invoice_date", { ascending: true }),
    ]);

    const { data: event, error: eventError } = eventRes;
    const { data: invoices, error: invoicesError } = invoicesRes;
    const { data: dailySales, error: dailySalesError } = dailySalesRes;

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
    const realized =
      invoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) ||
      0;
    const goal = Number(event.event_goal || 0);
    const percentage = goal > 0 ? (realized / goal) * 100 : 0;

    const dailySalesMap = dailySales?.reduce((acc: any, inv) => {
      const date = inv.invoice_date;
      acc[date] = (acc[date] || 0) + Number(inv.total_amount || 0);
      return acc;
    }, {});

    const dailySalesData = Object.keys(dailySalesMap || {}).map((date) => ({
      date,
      total: dailySalesMap[date],
    }));

    const yearlySalesMap = allEvents?.reduce((acc: any, ev) => {
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

    const yearlySalesData = Object.keys(yearlySalesMap || {})
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
      cardValue: Number(event.card_value || 10), // Assuming card_value exists or default to 10
      goal,
      realized,
      percentage,
      dailySales: dailySalesData,
      yearlySales: yearlySalesData,
      stats: {
        cmsCount: cmsCount || 0,
        customersCount: customersCount || 0,
      },
      recentContacts: recentContacts || [],
      recentInvoices: recentInvoices || [],
      userLevel,
    };
  } catch (error: any) {
    console.error("Unexpected error in getDashboardData:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches invoice details for a specific date (Drill down).
 */
export async function getInvoicesByDate(date: string) {
  const supabase = createAdminClient();
  const cookieStore = await cookies();
  const companyId = cookieStore.get("selected_company_id")?.value;

  if (!companyId) return { success: false, error: "No company" };

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "invoice_number, customer_name, total_amount, manager_name, payment_method",
    )
    .eq("company_id", companyId)
    .eq("invoice_date", date)
    .eq("status", "pagada")
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

/**
 * Fetches sales breakdown by manager for the current event (Drill down).
 */
export async function getSalesByManager() {
  const supabase = createAdminClient();
  const cookieStore = await cookies();
  const companyId = cookieStore.get("selected_company_id")?.value;

  if (!companyId) return { success: false, error: "No company" };

  // Get current event ID first
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
  const breakdownMap = data?.reduce((acc: any, inv) => {
    const name = inv.manager_name || "Sin asignar";
    acc[name] = (acc[name] || 0) + Number(inv.total_amount || 0);
    return acc;
  }, {});

  const breakdownData = Object.keys(breakdownMap)
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
export async function getInvoicesByManager(managerName: string) {
  const supabase = createAdminClient();
  const cookieStore = await cookies();
  const companyId = cookieStore.get("selected_company_id")?.value;

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
 * Fetches the cards linked to an invoice, including the assigned student
 * (if any) via students_cards -> students.
 */
export async function getInvoiceCards(invoiceNumber: string) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const companyId = cookieStore.get("selected_company_id")?.value;

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
export async function getCardTypeSummary() {
  const supabase = createAdminClient();
  const cookieStore = await cookies();
  const companyId = cookieStore.get("selected_company_id")?.value;

  if (!companyId) return { success: false, error: "No company" };

  const { data: company } = await supabase
    .from("companies")
    .select("def_dash_event_id")
    .eq("company_id", companyId)
    .single();

  if (!company?.def_dash_event_id) return { success: false, error: "No event" };

  // Paginar: el evento puede superar el límite de 1000 filas por consulta
  const pageSize = 1000;
  const rows: any[] = [];
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
        a.card_type.localeCompare(b.card_type) ||
        a.card_status.localeCompare(b.card_status),
    );

  return { success: true, data };
}

/**
 * Fetches card assignments by level and student for the current event.
 */
export async function getAssignmentByLevel() {
  const supabase = createAdminClient(); // Faster admin query
  const cookieStore = await cookies();
  const companyId = cookieStore.get("selected_company_id")?.value;

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
  const levelsMap = new Map<string, any>();

  for (const student of data || []) {
    const levelName = student.student_level || "Sin nivel";
    const levelData = levelsMap.get(levelName) || {
      level: levelName,
      subtotal_assigned: 0,
      subtotal_sold: 0,
      subtotal_cards: 0,
      students: [],
    };

    let studentAssigned = 0;
    let studentSold = 0;
    let studentCards = 0;

    const assignments = Array.isArray(student.students_cards)
      ? student.students_cards
      : [student.students_cards].filter(Boolean);

    for (const sc of assignments as any[]) {
      const card = sc.cards;
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
      students: level.students.sort((a: any, b: any) =>
        a.name.localeCompare(b.name),
      ),
    }));

  return { success: true, data: result };
}

/**
 * Fetches the cards assigned to a specific student in the current event.
 */
export async function getStudentCards(studentId: number) {
  const supabase = createAdminClient();
  const cookieStore = await cookies();
  const companyId = cookieStore.get("selected_company_id")?.value;

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
  if (!assignments || assignments.length === 0)
    return { success: true, data: [] };

  const cardNumbers = assignments.map((a: any) => a.card_number);

  // Then get the full card details
  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select(
      "card_number, card_type, card_status, player_name, player_phone_number, invoice_number",
    )
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
export async function getBingoCountries() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("country_codes")
    .select("name, phone_code, flag_emoji, iso2")
    .order("name", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
