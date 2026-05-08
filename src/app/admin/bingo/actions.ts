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

  const deleteExisting = formData.get("delete_existing_upload") === "on";

  // If requested, delete existing cards for this event first
  let deletedCount = 0;
  if (deleteExisting) {
    // 1. Get cards that can be deleted (status = 'Disponible')
    const { data: cardsToDelete, error: fetchError } = await supabase
      .from("cards")
      .select("card_number, image_url")
      .eq("company_id", companyId)
      .eq("event_id", eventId)
      .eq("card_status", "Disponible");

    if (fetchError) {
      console.error("Error fetching cards for deletion:", fetchError);
      return { error: "Error al buscar cartones para eliminar." };
    }

    if (cardsToDelete && cardsToDelete.length > 0) {
      console.log(
        `Eliminando ${cardsToDelete.length} cartones previos (Upload)...`,
      );
      // 2. Identify files to delete in Storage
      const filesToDelete = cardsToDelete
        .map((c) => {
          if (!c.image_url) return null;
          try {
            const urlParts = c.image_url.split("/cards_images/");
            if (urlParts.length > 1) {
              return urlParts[1];
            }
            return null;
          } catch (e) {
            return null;
          }
        })
        .filter((path): path is string => path !== null);

      console.log(
        `Archivos a eliminar en Storage (Upload): ${filesToDelete.length}`,
      );

      // 3. Delete from Storage
      if (filesToDelete.length > 0) {
        const { data: removedFiles, error: storageError } =
          await supabase.storage.from("cards_images").remove(filesToDelete);

        if (storageError) {
          console.warn("Error deleting files from storage:", storageError);
        } else {
          console.log(
            "Archivos eliminados de Storage con éxito (Upload):",
            removedFiles,
          );
        }
      }

      // 4. Delete from Database
      const { data: deletedRows, error: dbError } = await supabase
        .from("cards")
        .delete()
        .eq("company_id", companyId)
        .eq("event_id", eventId)
        .eq("card_status", "Disponible")
        .select();

      if (dbError) {
        console.error("Error deleting rows from DB:", dbError);
      } else {
        deletedCount = deletedRows?.length || 0;
        console.log(`Registros eliminados de BD (Upload): ${deletedCount}`);
      }
    }
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
          deleted_previous: deleteExisting,
          deleted_count: deletedCount,
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
    // 1. Get cards that can be deleted (status = 'Disponible')
    const { data: cardsToDelete, error: fetchError } = await supabase
      .from("cards")
      .select("card_number, image_url")
      .eq("company_id", companyId)
      .eq("event_id", eventId)
      .eq("card_status", "Disponible");

    if (fetchError) {
      console.error("Error fetching cards for deletion:", fetchError);
      return { error: "Error al buscar cartones para eliminar." };
    }

    if (cardsToDelete && cardsToDelete.length > 0) {
      console.log(`Eliminando ${cardsToDelete.length} cartones previos...`);
      // 2. Identify files to delete in Storage
      // We extract the filename from the public URL if possible
      const filesToDelete = cardsToDelete
        .map((c) => {
          if (!c.image_url) return null;
          try {
            // Extract the path from the URL
            // Format: .../storage/v1/object/public/cards_images/1/20250825113902/SERIAL_...pdf
            const urlParts = c.image_url.split("/cards_images/");
            if (urlParts.length > 1) {
              return urlParts[1];
            }
            return null;
          } catch (e) {
            return null;
          }
        })
        .filter((path): path is string => path !== null);

      console.log(`Archivos a eliminar en Storage: ${filesToDelete.length}`);

      // 3. Delete from Storage
      if (filesToDelete.length > 0) {
        const { data: removedFiles, error: storageError } =
          await supabase.storage.from("cards_images").remove(filesToDelete);

        if (storageError) {
          console.warn(
            "Some storage files could not be deleted:",
            storageError,
          );
        } else {
          console.log(
            "Archivos eliminados de Storage con éxito:",
            removedFiles,
          );
        }
      }

      // 4. Delete from Database (only those that are 'Disponible')
      const { data: deletedRows, error: deleteError } = await supabase
        .from("cards")
        .delete()
        .eq("company_id", companyId)
        .eq("event_id", eventId)
        .eq("card_status", "Disponible")
        .select();

      if (deleteError) {
        console.error("Error deleting cards from DB:", deleteError);
        return {
          error:
            "Error al eliminar cartones de la base de datos: " +
            deleteError.message,
        };
      }
      console.log(`Registros eliminados de BD: ${deletedRows?.length || 0}`);
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
 * Reassign card type (Virtual/Fisico) and log activity.
 */
export async function updateCardType(
  companyId: number,
  eventId: string,
  cardNumber: number,
  newType: string,
  officialName: string,
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  // 1. Get current card data for logging
  const { data: card, error: fetchError } = await supabase
    .from("cards")
    .select("card_type, card_status")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .eq("card_number", cardNumber)
    .single();

  if (fetchError || !card) {
    return { error: "No se encontró el cartón." };
  }

  // 2. Update card type
  const { error: updateError } = await supabase
    .from("cards")
    .update({
      card_type: newType,
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .eq("card_number", cardNumber);

  if (updateError) {
    return { error: updateError.message };
  }

  // 3. Log activity
  await supabase.from("user_activity_log").insert({
    user_id: user.id,
    action: "REASSIGN_CARD_TYPE",
    entity: "cards",
    metadata: {
      company_id: companyId,
      event_id: eventId,
      card_number: cardNumber,
      old_type: card.card_type,
      new_type: newType,
      requested_by: officialName,
      timestamp: new Date().toISOString(),
    },
  });

  revalidatePath("/admin/bingo");
  return { success: true };
}
/**
 * Reassign card type for a range of cards and log activity.
 */
export async function updateCardRangeType(
  companyId: number,
  eventId: string,
  start: number,
  end: number,
  newType: string,
  officialName: string,
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  if (start > end) {
    return { error: "El rango inicial no puede ser mayor al final." };
  }

  // 1. Update card type in range
  const { error: updateError, data: updatedCards } = await supabase
    .from("cards")
    .update({
      card_type: newType,
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .gte("card_number", start)
    .lte("card_number", end)
    .select("card_number");

  if (updateError) {
    return { error: updateError.message };
  }

  // 2. Log activity
  await supabase.from("user_activity_log").insert({
    user_id: user.id,
    action: "REASSIGN_CARD_RANGE_TYPE",
    entity: "cards",
    metadata: {
      company_id: companyId,
      event_id: eventId,
      range: `${start}-${end}`,
      new_type: newType,
      requested_by: officialName,
      updated_count: updatedCards?.length || 0,
      timestamp: new Date().toISOString(),
    },
  });

  revalidatePath("/admin/bingo");
  return { success: true, updated_count: updatedCards?.length || 0 };
}

/**
 * Update a single card's details and optionally its PDF image.
 */
export async function updateSingleCard(
  companyId: number,
  eventId: string,
  cardNumber: number,
  formData: FormData,
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  const newType = formData.get("card_type") as string;
  const newStatus = formData.get("card_status") as string;
  const newPrice = parseFloat(formData.get("card_price") as string);
  const salesPrice = formData.get("sales_price")
    ? parseFloat(formData.get("sales_price") as string)
    : null;
  const soldBy = formData.get("sold_by") as string;
  const playerName = formData.get("player_name") as string;
  const playerPhone = formData.get("player_phone_number") as string;
  const playerEmail = formData.get("player_email") as string;
  const prize = formData.get("prize") as string;
  const comment = formData.get("comment") as string;
  const invoiceNumber = formData.get("invoice_number") as string;
  const file = formData.get("file") as File;

  // 1. Get current data for comparison and potential file cleanup
  const { data: currentCard, error: fetchError } = await supabase
    .from("cards")
    .select("*")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .eq("card_number", cardNumber)
    .single();

  if (fetchError || !currentCard) {
    return { error: "No se encontró el cartón original." };
  }

  const updates: any = {
    card_type: newType,
    card_status: newStatus,
    card_price: newPrice,
    sales_price: salesPrice,
    sold_by: soldBy,
    player_name: playerName,
    player_phone_number: playerPhone,
    player_email: playerEmail,
    prize: prize,
    comment: comment,
    invoice_number: invoiceNumber,
    updated_at: new Date().toISOString(),
  };

  // 2. Handle File Upload if present
  if (file && file.size > 0) {
    // Determine fileName (use original format)
    const fileName = `SERIAL_${eventId}_Carton_${cardNumber}.pdf`;
    const storagePath = `${companyId}/${eventId}/${fileName}`;

    // Upload/Replace in Storage
    const { error: uploadError } = await supabase.storage
      .from("cards_images")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      return { error: `Error al subir PDF: ${uploadError.message}` };
    }

    // Get new public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("cards_images").getPublicUrl(storagePath);

    updates.image_url = publicUrl;
  }

  // 3. Update DB record
  const { error: updateError } = await supabase
    .from("cards")
    .update(updates)
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .eq("card_number", cardNumber);

  if (updateError) {
    return { error: updateError.message };
  }

  // 4. Log activity
  await supabase.from("user_activity_log").insert({
    user_id: user.id,
    action: "UPDATE_SINGLE_CARD",
    entity: "cards",
    metadata: {
      company_id: companyId,
      event_id: eventId,
      card_number: cardNumber,
      changes: updates,
      timestamp: new Date().toISOString(),
    },
  });

  revalidatePath("/admin/bingo");
  return { success: true };
}

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
 * Save a new invoice and update associated cards.
 */
export async function saveInvoice(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  const company_id = parseInt(formData.get("company_id") as string);
  const event_id = formData.get("event_id") as string;
  const invoice_number = formData.get("invoice_number") as string;
  const invoice_date = formData.get("invoice_date") as string;
  const customer_name = formData.get("customer_name") as string;
  const customer_email = formData.get("customer_email") as string;
  const phone_area = formData.get("phone_area") as string;
  const phone_number = formData.get("phone_number") as string;
  const whatsapp_number = formData.get("whatsapp_number") as string;
  const manager_name = formData.get("manager_name") as string;
  const cards_number = parseInt(formData.get("cards_number") as string);
  const card_price = parseFloat(formData.get("card_price") as string);
  const total_amount = parseFloat(formData.get("total_amount") as string);
  const payment_method = formData.get("payment_method") as string;
  const status = formData.get("status") as string;
  const associated_cards = JSON.parse(
    (formData.get("associated_cards") as string) || "[]",
  );
  const invoice_file = formData.get("invoice_file") as File;

  let url_invoice = "";

  // 1. Handle File Upload if present
  if (invoice_file && invoice_file.size > 0) {
    const fileExt = invoice_file.name.split(".").pop();
    const fileName = `${invoice_number}_${Date.now()}.${fileExt}`;
    const storagePath = `${company_id}/${event_id}/${fileName}`;

    // Convert File to ArrayBuffer for Supabase Storage in Node.js environment
    const arrayBuffer = await invoice_file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("invoices_images")
      .upload(storagePath, arrayBuffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: invoice_file.type,
      });

    if (uploadError) {
      return {
        error: `Error al subir imagen de factura: ${uploadError.message}`,
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("invoices_images").getPublicUrl(storagePath);
    url_invoice = publicUrl;
  }

  const invoiceData = {
    company_id,
    event_id,
    invoice_number,
    invoice_date,
    customer_name,
    customer_email,
    phone_area,
    phone_number,
    whatsapp_number,
    manager_name,
    cards_number,
    card_price,
    total_amount,
    payment_method,
    status,
    url_invoice,
    updated_at: new Date().toISOString(),
  };

  // 2. Insert Invoice
  const { error: invoiceError } = await supabase
    .from("invoices")
    .insert([invoiceData]);

  if (invoiceError) return { error: invoiceError.message };

  // 3. Update Associated Cards
  if (associated_cards.length > 0) {
    const { error: cardsError } = await supabase
      .from("cards")
      .update({
        card_status: "Vendido",
        invoice_number: invoice_number,
        sales_price: card_price,
        sold_by: manager_name,
        player_name: customer_name,
        player_phone_number: whatsapp_number,
        player_email: customer_email,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", company_id)
      .eq("event_id", event_id)
      .in("card_number", associated_cards);

    if (cardsError) {
      return {
        error: `Factura guardada pero error al actualizar cartones: ${cardsError.message}`,
      };
    }
  }

  // 4. Log activity
  await supabase.from("user_activity_log").insert({
    user_id: user.id,
    action: "INSERT",
    entity: "invoices",
    metadata: {
      invoice_number,
      event_id,
      customer_name,
      total_amount,
      associated_cards,
      timestamp: new Date().toISOString(),
    },
  });

  revalidatePath("/admin/bingo");
  return { success: true };
}

/**
 * Update an existing invoice and associated cards.
 */
export async function updateInvoice(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  const id = formData.get("id") as string;
  const company_id = parseInt(formData.get("company_id") as string);
  const event_id = formData.get("event_id") as string;
  const invoice_number = formData.get("invoice_number") as string;
  const invoice_date = formData.get("invoice_date") as string;
  const customer_name = formData.get("customer_name") as string;
  const customer_email = formData.get("customer_email") as string;
  const phone_area = formData.get("phone_area") as string;
  const phone_number = formData.get("phone_number") as string;
  const whatsapp_number = formData.get("whatsapp_number") as string;
  const manager_name = formData.get("manager_name") as string;
  const cards_number = parseInt(formData.get("cards_number") as string);
  const card_price = parseFloat(formData.get("card_price") as string);
  const total_amount = parseFloat(formData.get("total_amount") as string);
  const payment_method = formData.get("payment_method") as string;
  const status = formData.get("status") as string;
  const associated_cards = JSON.parse(
    (formData.get("associated_cards") as string) || "[]",
  );
  const invoice_file = formData.get("invoice_file") as File;

  // 1. Get current invoice to handle file cleanup if needed
  const { data: currentInvoice } = await supabase
    .from("invoices")
    .select("url_invoice, invoice_number")
    .eq("id", id)
    .single();

  let url_invoice = currentInvoice?.url_invoice || "";

  // 2. Handle File Upload if present
  if (invoice_file && invoice_file.size > 0) {
    const fileExt = invoice_file.name.split(".").pop();
    const fileName = `${invoice_number}_${Date.now()}.${fileExt}`;
    const storagePath = `${company_id}/${event_id}/${fileName}`;

    // Convert File to ArrayBuffer for Supabase Storage in Node.js environment
    const arrayBuffer = await invoice_file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("invoices_images")
      .upload(storagePath, arrayBuffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: invoice_file.type,
      });

    if (uploadError) {
      return {
        error: `Error al subir imagen de factura: ${uploadError.message}`,
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("invoices_images").getPublicUrl(storagePath);
    url_invoice = publicUrl;
  }

  const invoiceData: any = {
    company_id,
    event_id,
    invoice_number,
    invoice_date,
    customer_name,
    customer_email,
    phone_area,
    phone_number,
    whatsapp_number,
    manager_name,
    cards_number,
    card_price,
    total_amount,
    payment_method,
    status,
    url_invoice,
    updated_at: new Date().toISOString(),
  };

  // 3. Update Invoice
  const { error: invoiceError } = await supabase
    .from("invoices")
    .update(invoiceData)
    .eq("id", id);

  if (invoiceError) return { error: invoiceError.message };

  // 4. Update Associated Cards
  // First, clear previous cards linked to this invoice number
  if (currentInvoice?.invoice_number) {
    await supabase
      .from("cards")
      .update({
        card_status: "Disponible",
        invoice_number: null,
        sales_price: null,
        sold_by: null,
        player_name: null,
        player_phone_number: null,
        player_email: null,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", company_id)
      .eq("event_id", event_id)
      .eq("invoice_number", currentInvoice.invoice_number);
  }

  // Now link the new selection
  if (associated_cards.length > 0) {
    const { error: cardsError } = await supabase
      .from("cards")
      .update({
        card_status: "Vendido",
        invoice_number: invoice_number,
        sales_price: card_price,
        sold_by: manager_name,
        player_name: customer_name,
        player_phone_number: whatsapp_number,
        player_email: customer_email,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", company_id)
      .eq("event_id", event_id)
      .in("card_number", associated_cards);

    if (cardsError) {
      return {
        error: `Factura actualizada pero error al vincular cartones: ${cardsError.message}`,
      };
    }
  }

  // 5. Log activity
  await supabase.from("user_activity_log").insert({
    user_id: user.id,
    action: "UPDATE",
    entity: "invoices",
    metadata: {
      invoice_id: id,
      invoice_number,
      event_id,
      customer_name,
      associated_cards,
      timestamp: new Date().toISOString(),
    },
  });

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

/**
 * Update the WhatsApp sending status for an invoice.
 */
export async function updateInvoiceWhatsAppStatus(id: string, status: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Get invoice details for logging
  const { data: invoice } = await supabase
    .from("invoices")
    .select("invoice_number, event_id, customer_name")
    .eq("id", id)
    .single();

  // 2. Update the invoice status
  const { error } = await supabase
    .from("invoices")
    .update({
      send_whatsapp_message: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  // 3. Log activity for audit
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "SEND_WHATSAPP",
      entity: "invoices",
      metadata: {
        invoice_id: id,
        invoice_number: invoice?.invoice_number,
        event_id: invoice?.event_id,
        customer_name: invoice?.customer_name,
        status: status,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/bingo");
  return { success: true };
}

/**
 * Fetch the WhatsApp message template from site_content.
 */
export async function getWhatsAppMessageTemplate() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .eq("page", "whatsapp message")
    .eq("section_key", "cartones")
    .eq("is_active", true)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

/**
 * Fetch cards associated with a specific invoice.
 */
export async function getCardsForInvoice(
  companyId: number,
  eventId: string,
  invoiceNumber: string,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .eq("invoice_number", invoiceNumber);

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

/**
 * Send automated WhatsApp messages and documents via Ultramsg.
 */
export async function sendWhatsAppAutomation(payload: {
  to: string;
  message: string;
  templateImage?: string;
  invoiceUrl?: string;
  cardUrls: string[];
}) {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;

  if (!instanceId || !token) {
    return { success: false, error: "Ultramsg credentials not configured." };
  }

  const baseUrl = `https://api.ultramsg.com/${instanceId}/messages`;

  try {
    const results = [];

    // 1. Send Template Image (if provided)
    if (payload.templateImage) {
      const imgRes = await fetch(`${baseUrl}/image`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token,
          to: payload.to,
          image: payload.templateImage,
          caption: "Bingo La Rioja",
          priority: "10",
        }),
      });
      results.push({ step: "template_image", status: imgRes.status });
    }

    // 2. Send Text Message
    const textRes = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token,
        to: payload.to,
        body: payload.message,
        priority: "10",
      }),
    });
    results.push({ step: "text", status: textRes.status });

    // 3. Send Invoice PDF (if provided)
    if (payload.invoiceUrl) {
      const invRes = await fetch(`${baseUrl}/document`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token,
          to: payload.to,
          document: payload.invoiceUrl,
          filename: "Factura_Bingo.pdf",
          caption: "Factura de Compra",
          priority: "10",
        }),
      });
      results.push({ step: "invoice_pdf", status: invRes.status });
    }

    // 4. Send Card PDFs
    for (let index = 0; index < payload.cardUrls.length; index++) {
      const cardUrl = payload.cardUrls[index];
      const cardRes = await fetch(`${baseUrl}/document`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token,
          to: payload.to,
          document: cardUrl,
          filename: `Carton_Bingo_${index + 1}.pdf`,
          caption: `Cartón de Bingo #${index + 1}`,
          priority: "10",
        }),
      });
      results.push({ step: `card_pdf_${index + 1}`, status: cardRes.status });
    }

    return { success: true, results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
