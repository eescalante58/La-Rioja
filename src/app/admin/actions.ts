"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

/**
 * Fetches dashboard data for the selected company and its default event.
 * @returns {Promise<any>} Dashboard statistics and event data.
 */
export async function getDashboardData() {
  const supabase = createClient();
  const companyId = cookies().get("selected_company_id")?.value;

  if (!companyId) {
    return { success: false, error: "No company selected" };
  }

  try {
    // 1. Get the default event ID for the dashboard from the company settings
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("def_dash_event_id, company_name")
      .eq("company_id", companyId)
      .single();

    if (companyError || !company) {
      console.error("Error fetching company dash settings:", companyError);
      return { success: false, error: "Company settings not found" };
    }

    const eventId = company.def_dash_event_id;

    if (!eventId) {
      return {
        success: true,
        companyName: company.company_name,
        hasEvent: false,
      };
    }

    // 2. Get event details (name and goal)
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("event_name, event_goal")
      .eq("event_id", eventId)
      .eq("company_id", companyId)
      .single();

    if (eventError || !event) {
      console.error("Error fetching event details:", eventError);
      return { success: false, error: "Event details not found" };
    }

    // 3. Calculate realized sales from invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("total_amount")
      .eq("event_id", eventId)
      .eq("company_id", companyId)
      .eq("status", "pagada"); // Only count paid invoices

    if (invoicesError) {
      console.error("Error fetching invoices:", invoicesError);
      return { success: false, error: "Error calculating sales" };
    }

    const realized =
      invoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) ||
      0;
    const goal = Number(event.event_goal || 0);
    const percentage = goal > 0 ? (realized / goal) * 100 : 0;

    // 4. Calculate daily sales
    const { data: dailySales, error: dailySalesError } = await supabase
      .from("invoices")
      .select("invoice_date, total_amount")
      .eq("event_id", eventId)
      .eq("company_id", companyId)
      .eq("status", "pagada")
      .order("invoice_date", { ascending: true });

    if (dailySalesError) {
      console.error("Error fetching daily sales:", dailySalesError);
    }

    const dailySalesMap = dailySales?.reduce((acc: any, inv) => {
      const date = inv.invoice_date;
      acc[date] = (acc[date] || 0) + Number(inv.total_amount || 0);
      return acc;
    }, {});

    const dailySalesData = Object.keys(dailySalesMap || {}).map((date) => ({
      date,
      total: dailySalesMap[date],
    }));

    // 5. Also fetch some general stats for the other panel
    const { count: cmsCount } = await supabase
      .from("site_content")
      .select("*", { count: "exact", head: true });

    const { count: customersCount } = await supabase
      .from("customer_phone_number")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    // 6. Fetch recent contact submissions
    const { data: recentContacts, error: contactError } = await supabase
      .from("contact_submissions")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (contactError) {
      console.error("Error fetching recent contact submissions:", contactError);
    }

    // 7. Calculate sales by year from all events
    const { data: allEvents, error: allEventsError } = await supabase
      .from("events")
      .select("event_date, total_amount_solded, event_id, is_active, status")
      .eq("company_id", companyId);

    if (allEventsError) {
      console.error("Error fetching events for yearly sales:", allEventsError);
    }

    const yearlySalesMap = allEvents?.reduce((acc: any, ev) => {
      let year = "";
      if (ev.event_date) {
        year = new Date(ev.event_date).getFullYear().toString();
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
      companyName: company.company_name,
      hasEvent: true,
      eventName: event.event_name,
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
  const supabase = createClient();
  const companyId = cookies().get("selected_company_id")?.value;

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
  const supabase = createClient();
  const companyId = cookies().get("selected_company_id")?.value;

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
