"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Fetch all data needed for Bingo management.
 */
export async function getBingoData() {
  const supabase = createClient();

  const [eventsRes, companiesRes, countriesRes] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false }),
    supabase.from("companies").select("company_id, company_name"),
    supabase
      .from("country_codes")
      .select("name, phone_code, flag_emoji, iso2")
      .order("name", { ascending: true }),
  ]);

  return {
    events: eventsRes.data || [],
    companies: companiesRes.data || [],
    countries: countriesRes.data || [],
    error:
      eventsRes.error?.message ||
      companiesRes.error?.message ||
      countriesRes.error?.message ||
      null,
  };
}

/**
 * Save or update a Bingo event.
 */
export async function saveEvent(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const id = formData.get("id");
  const company_id = formData.get("company_id");
  const event_id = formData.get("event_id") as string;
  const event_name = formData.get("event_name") as string;
  const event_date = formData.get("event_date") as string;
  const card_value = parseFloat((formData.get("card_value") as string) || "0");
  const status = (formData.get("status") as string) || "Inactivo";
  const event_manager = formData.get("event_manager") as string;
  const event_goal = formData.get("event_goal")
    ? parseFloat(formData.get("event_goal") as string)
    : null;
  const event_cartons_number = formData.get("event_cartons_number")
    ? parseInt(formData.get("event_cartons_number") as string)
    : null;
  const event_start_promotion_date =
    formData.get("event_start_promotion_date") || null;

  const eventData = {
    company_id,
    event_id,
    event_name,
    event_date,
    card_value,
    status,
    event_manager,
    event_goal,
    event_cartons_number,
    event_start_promotion_date,
    updated_at: new Date().toISOString(),
  };

  let error;
  let action: "INSERT" | "UPDATE" = id ? "UPDATE" : "INSERT";

  if (id) {
    const { error: err } = await supabase
      .from("events")
      .update(eventData)
      .eq("id", id);
    error = err;
  } else {
    const { error: err } = await supabase.from("events").insert([eventData]);
    error = err;
  }

  if (error) return { error: error.message };

  // Log activity
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: action,
      entity: "events",
      metadata: {
        event_name,
        event_id,
        status,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/bingo");
  return { success: true };
}

/**
 * Delete a Bingo event.
 */
export async function deleteEvent(id: number) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get event details before deleting for the log
  const { data: event } = await supabase
    .from("events")
    .select("event_name, event_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) return { error: error.message };

  // Log activity
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "DELETE",
      entity: "events",
      metadata: {
        event_id: id,
        event_slug: event?.event_id,
        event_name: event?.event_name || "Unknown",
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/bingo");
  return { success: true };
}

/**
 * Fetch cards for a specific event.
 */
export async function getEventCards(companyId: number, eventId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .order("card_number", { ascending: true });

  if (error) return { error: error.message };
  return { data };
}

/**
 * Bulk generate cards for an event.
 */
export async function generateCards(
  companyId: number,
  eventId: string,
  start: number,
  end: number,
  price: number,
) {
  const supabase = createClient();
  const cards = [];

  for (let i = start; i <= end; i++) {
    cards.push({
      company_id: companyId,
      event_id: eventId,
      card_number: i,
      card_status: "Disponible",
      card_price: price,
      card_type: "Virtual",
    });
  }

  const { error } = await supabase.from("cards").insert(cards);
  if (error) return { error: error.message };

  revalidatePath("/admin/bingo");
  return { success: true };
}

/**
 * Fetch invoices for a specific event.
 */
export async function getInvoices(companyId: number, eventId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .order("invoice_date", { ascending: false });

  if (error) return { error: error.message };
  return { success: true, data };
}

/**
 * Save a new invoice.
 */
export async function saveInvoice(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const company_id = parseInt(formData.get("company_id") as string);
  const event_id = formData.get("event_id") as string;
  const invoice_number = formData.get("invoice_number") as string;
  const invoice_date = formData.get("invoice_date") as string;
  const customer_name = formData.get("customer_name") as string;
  const customer_email = formData.get("customer_email") as string;
  const phone_area = formData.get("phone_area") as string;
  const phone_number = formData.get("phone_number") as string;
  const cards_number = parseInt(formData.get("cards_number") as string);
  const card_price = parseFloat(formData.get("card_price") as string);
  const total_amount = parseFloat(formData.get("total_amount") as string);
  const payment_method = formData.get("payment_method") as string;
  const status = formData.get("status") as string;

  const invoiceData = {
    company_id,
    event_id,
    invoice_number,
    invoice_date,
    customer_name,
    customer_email,
    phone_area,
    phone_number,
    cards_number,
    card_price,
    total_amount,
    payment_method,
    status,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("invoices").insert([invoiceData]);

  if (error) return { error: error.message };

  // Log activity
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "INSERT",
      entity: "invoices",
      metadata: {
        invoice_number,
        event_id,
        customer_name,
        total_amount,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/bingo");
  return { success: true };
}

/**
 * Update an existing invoice.
 */
export async function updateInvoice(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const id = formData.get("id") as string;
  const company_id = parseInt(formData.get("company_id") as string);
  const event_id = formData.get("event_id") as string;
  const invoice_number = formData.get("invoice_number") as string;
  const invoice_date = formData.get("invoice_date") as string;
  const customer_name = formData.get("customer_name") as string;
  const customer_email = formData.get("customer_email") as string;
  const phone_area = formData.get("phone_area") as string;
  const phone_number = formData.get("phone_number") as string;
  const cards_number = parseInt(formData.get("cards_number") as string);
  const card_price = parseFloat(formData.get("card_price") as string);
  const total_amount = parseFloat(formData.get("total_amount") as string);
  const payment_method = formData.get("payment_method") as string;
  const status = formData.get("status") as string;

  const invoiceData = {
    company_id,
    event_id,
    invoice_number,
    invoice_date,
    customer_name,
    customer_email,
    phone_area,
    phone_number,
    cards_number,
    card_price,
    total_amount,
    payment_method,
    status,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("invoices")
    .update(invoiceData)
    .eq("id", id);

  if (error) return { error: error.message };

  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "UPDATE",
      entity: "invoices",
      metadata: {
        invoice_id: id,
        invoice_number,
        event_id,
        customer_name,
        total_amount,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/bingo");
  return { success: true };
}

/**
 * Delete an invoice.
 */
export async function deleteInvoice(id: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("invoice_number, event_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) return { error: error.message };

  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "DELETE",
      entity: "invoices",
      metadata: {
        invoice_id: id,
        invoice_number: invoice?.invoice_number,
        event_id: invoice?.event_id,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/bingo");
  return { success: true };
}
