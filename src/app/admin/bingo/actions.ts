"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Upload card images and create card records.
 */
export async function uploadCardImages(
  companyId: number,
  eventId: string,
  cardPrice: number,
  formData: FormData,
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const files = formData.getAll("files") as File[];
  if (!files || files.length === 0) {
    return { error: "No se seleccionaron archivos." };
  }

  const results = {
    success_count: 0,
    error_count: 0,
    errors: [] as string[],
  };

  for (const file of files) {
    const fileName = file.name;
    // Pattern: SERIAL_ (7) + EventID (14) + _Carton_ (8) + CardNumber
    // Example: SERIAL_20250825113902_Carton_1.pdf

    try {
      // 1. Extract info from filename
      const match = fileName.match(/^SERIAL_(\d{14})_Carton_(\d+)\.pdf$/i);
      if (!match) {
        results.error_count++;
        results.errors.push(
          `Archivo ${fileName}: El nombre no sigue el patrón SERIAL_EventoID_Carton_Numero.pdf`,
        );
        continue;
      }

      const fileEventId = match[1];
      const cardNumber = parseInt(match[2]);

      // 2. Basic validations
      if (fileEventId !== eventId) {
        results.error_count++;
        results.errors.push(
          `Archivo ${fileName}: El ID de evento del archivo (${fileEventId}) no coincide con el evento seleccionado (${eventId}).`,
        );
        continue;
      }

      // 3. Check if card already exists in DB
      const { data: existingCard, error: checkError } = await supabase
        .from("cards")
        .select("id")
        .eq("company_id", companyId)
        .eq("event_id", eventId)
        .eq("card_number", cardNumber)
        .maybeSingle();

      if (checkError) {
        results.error_count++;
        results.errors.push(
          `Archivo ${fileName}: Error al verificar existencia en BD.`,
        );
        continue;
      }

      if (existingCard) {
        results.error_count++;
        results.errors.push(
          `Archivo ${fileName}: El cartón número ${cardNumber} ya existe en este evento.`,
        );
        continue;
      }

      // 4. Upload to Storage
      const storagePath = `${companyId}/${eventId}/${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("cards_images")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        results.error_count++;
        results.errors.push(
          `Archivo ${fileName}: Error al subir al bucket (${uploadError.message}).`,
        );
        continue;
      }

      // 5. Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("cards_images").getPublicUrl(storagePath);

      // 6. Create record in DB
      const { error: insertError } = await supabase.from("cards").insert({
        company_id: companyId,
        event_id: eventId,
        card_number: cardNumber,
        card_price: cardPrice,
        card_type: "Virtual",
        card_status: "Disponible",
        image_url: publicUrl,
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        // Rollback storage if DB fails
        await supabase.storage.from("cards_images").remove([storagePath]);
        results.error_count++;
        results.errors.push(
          `Archivo ${fileName}: Error al crear registro en BD (${insertError.message}).`,
        );
        continue;
      }

      results.success_count++;
    } catch (err: any) {
      results.error_count++;
      results.errors.push(
        `Archivo ${fileName}: Error inesperado (${err.message}).`,
      );
    }
  }

  // Update event cartons count if needed
  if (results.success_count > 0) {
    const { data: cards } = await supabase
      .from("cards")
      .select("card_number")
      .eq("company_id", companyId)
      .eq("event_id", eventId);

    if (cards && cards.length > 0) {
      const maxCardNumber = Math.max(
        ...cards.map((c) => Number(c.card_number)),
      );
      await supabase
        .from("events")
        .update({ event_cartons_number: maxCardNumber })
        .eq("company_id", companyId)
        .eq("event_id", eventId);
    }

    if (user) {
      await supabase.from("user_activity_log").insert({
        user_id: user.id,
        action: "UPLOAD_CARDS_IMAGES",
        entity: "cards",
        metadata: {
          company_id: companyId,
          event_id: eventId,
          success_count: results.success_count,
          error_count: results.error_count,
          timestamp: new Date().toISOString(),
        },
      });
    }
    revalidatePath("/admin/bingo");
  }

  return { success: results.error_count === 0, ...results };
}

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
  deleteExisting: boolean = false,
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (start > end) {
    return { error: "El número inicial no puede ser mayor al número final." };
  }

  const count = end - start + 1;
  if (count > 5000) {
    return { error: "No se pueden generar más de 5,000 cartones a la vez." };
  }

  // If requested, delete existing cards for this event first
  if (deleteExisting) {
    const { error: deleteError } = await supabase
      .from("cards")
      .delete()
      .eq("company_id", companyId)
      .eq("event_id", eventId);

    if (deleteError) {
      console.error("Error deleting existing cards:", deleteError);
      return {
        error: "Error al eliminar cartones previos: " + deleteError.message,
      };
    }
  }

  const cards = [];
  for (let i = start; i <= end; i++) {
    cards.push({
      company_id: companyId,
      event_id: eventId,
      card_number: i,
      card_status: "Disponible",
      card_price: price,
      card_type: "Virtual",
      updated_at: new Date().toISOString(),
    });
  }

  // Use upsert to avoid failing on duplicates if some cards already exist
  const { error } = await supabase.from("cards").upsert(cards, {
    onConflict: "company_id,event_id,card_number",
  });

  if (error) {
    console.error("Error generating cards:", error);
    return { error: error.message };
  }

  // Update the event's total cartons number if it has increased
  const { data: event } = await supabase
    .from("events")
    .select("event_cartons_number")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .single();

  if (event && (event.event_cartons_number || 0) < end) {
    await supabase
      .from("events")
      .update({ event_cartons_number: end })
      .eq("company_id", companyId)
      .eq("event_id", eventId);
  }

  // Log activity
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "GENERATE_CARDS",
      entity: "cards",
      metadata: {
        company_id: companyId,
        event_id: eventId,
        range: `${start}-${end}`,
        count: count,
        price: price,
        deleted_previous: deleteExisting,
        timestamp: new Date().toISOString(),
      },
    });
  }

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
