"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  requireRoleLevel,
  requireCompanyAccess,
} from "@/lib/auth/authorization";
import { withRole, withCompanyAccess } from "@/lib/auth/guards";
import { 
  eventSchema, 
  invoiceSchema, 
  generateCardsSchema, 
  updateCardTypeSchema, 
  updateCardRangeTypeSchema, 
  singleCardSchema 
} from "@/lib/validation/bingo";

/**
 * Sanitizes string input for Bingo operations.
 */
function sanitizeInput(str: string): string {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, ""); // Strips all HTML tags for safety
}

/**
 * Upload card images and create card records.
 */
async function uploadCardImagesInternal(
  companyId: number,
  eventId: string,
  cardPrice: number,
  formData: FormData,
  context: { user: any }
) {
  const { user } = context;
  // Validation with Zod
  const validation = generateCardsSchema.pick({
    company_id: true,
    event_id: true,
    price: true,
  }).safeParse({
    company_id: companyId,
    event_id: eventId,
    price: cardPrice,
  });

  if (!validation.success) {
    return { error: "Datos inválidos: " + validation.error.issues.map(e => e.message).join(", ") };
  }
  const data = validation.data;

  const supabase = await createClient();

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
      .eq("company_id", data.company_id)
      .eq("event_id", data.event_id)
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
        }
      }

      // 4. Delete from Database
      const { data: deletedRows, error: dbError } = await supabase
        .from("cards")
        .delete()
        .eq("company_id", data.company_id)
        .eq("event_id", data.event_id)
        .eq("card_status", "Disponible")
        .select();

      if (dbError) {
        console.error("Error deleting rows from DB:", dbError);
      } else {
        deletedCount = deletedRows?.length || 0;
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
      if (fileEventId !== data.event_id) {
        results.error_count++;
        results.errors.push(
          `Archivo ${fileName}: El ID de evento del archivo (${fileEventId}) no coincide con el evento seleccionado (${data.event_id}).`,
        );
        continue;
      }

      // 3. Check if card already exists in DB
      const { data: existingCard, error: checkError } = await supabase
        .from("cards")
        .select("id")
        .eq("company_id", data.company_id)
        .eq("event_id", data.event_id)
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
      const storagePath = `${data.company_id}/${data.event_id}/${fileName}`;
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
        company_id: data.company_id,
        event_id: data.event_id,
        card_number: cardNumber,
        card_price: data.price,
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
      .eq("company_id", data.company_id)
      .eq("event_id", data.event_id);

    if (cards && cards.length > 0) {
      const maxCardNumber = Math.max(
        ...cards.map((c) => Number(c.card_number)),
      );
      await supabase
        .from("events")
        .update({ event_cartons_number: maxCardNumber })
        .eq("company_id", data.company_id)
        .eq("event_id", data.event_id);
    }

    if (user) {
      await supabase.from("user_activity_log").insert({
        user_id: user.id,
        action: "UPLOAD_CARDS_IMAGES",
        entity: "cards",
        metadata: {
          company_id: data.company_id,
          event_id: data.event_id,
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

export const uploadCardImages = withRole(40, withCompanyAccess(uploadCardImagesInternal, 0));

async function getBingoDataInternal(context: { user: any, level: number }) {
  const { user, level } = context;
  const supabase = await createClient();

  // If not Super Admin (100), only fetch data for the companies the user belongs to
  let eventsQuery = supabase.from("events").select("*");
  let companiesQuery = supabase
    .from("companies")
    .select("company_id, company_name");

  if (level < 100) {
    const { data: memberships } = await supabase
      .from("user_companies")
      .select("company_id")
      .eq("user_id", user?.id);

    const companyIds = memberships?.map((m) => m.company_id) || [];

    eventsQuery = eventsQuery.in("company_id", companyIds);
    companiesQuery = companiesQuery.in("company_id", companyIds);
  }

  const [eventsRes, companiesRes, countriesRes] = await Promise.all([
    eventsQuery.order("event_date", { ascending: false }),
    companiesQuery,
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

export const getBingoData = withRole(40, getBingoDataInternal);

/**
 * Save or update a Bingo event.
 */
async function saveEventInternal(formData: FormData, context: { user: any }) {
  const { user } = context;
  const id = formData.get("id");
  const rawData = {
    company_id: parseInt(formData.get("company_id") as string),
    event_id: formData.get("event_id") as string,
    event_name: formData.get("event_name") as string,
    event_date: formData.get("event_date") as string,
    card_value: parseFloat((formData.get("card_value") as string) || "0"),
    status: (formData.get("status") as string) || "Inactivo",
    event_manager: formData.get("event_manager") as string,
    event_goal: formData.get("event_goal") ? parseFloat(formData.get("event_goal") as string) : null,
    event_cartons_number: formData.get("event_cartons_number") ? parseInt(formData.get("event_cartons_number") as string) : null,
    event_start_promotion_date: formData.get("event_start_promotion_date") || null,
  };

  // Validation with Zod
  const validation = eventSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: "Datos inválidos: " + validation.error.issues.map(e => e.message).join(", ") };
  }
  const eventData = {
    ...validation.data,
    event_id: sanitizeInput(validation.data.event_id),
    event_name: sanitizeInput(validation.data.event_name),
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();

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
        event_name: eventData.event_name,
        event_id: eventData.event_id,
        status: eventData.status,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/bingo");
  revalidatePath("/admin");
  return { success: true };
}

export const saveEvent = withRole(80, saveEventInternal);

/**
 * Delete a Bingo event.
 */
async function deleteEventInternal(id: number, context: { user: any }) {
  const { user } = context;
  const supabase = await createClient();

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
  revalidatePath("/admin");
  return { success: true };
}

export const deleteEvent = withRole(100, deleteEventInternal);

async function getEventCardsInternal(companyId: number, eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .order("card_number", { ascending: true });

  if (error) return { error: error.message };
  return { data };
}

export const getEventCards = withRole(40, withCompanyAccess(getEventCardsInternal, 0));

async function generateCardsInternal(
  companyId: number,
  eventId: string,
  start: number,
  end: number,
  price: number,
  deleteExisting: boolean = false,
  context: { user: any }
) {
  const { user } = context;
  // Validation with Zod
  const validation = generateCardsSchema.safeParse({
    company_id: companyId,
    event_id: eventId,
    start,
    end,
    price,
    deleteExisting,
  });
  if (!validation.success) {
    return { error: "Datos inválidos: " + validation.error.issues.map(e => e.message).join(", ") };
  }
  const data = validation.data;

  const supabase = await createClient();

  if (data.start > data.end) {
    return { error: "El número inicial no puede ser mayor al número final." };
  }

  const count = data.end - data.start + 1;
  if (count > 5000) {
    return { error: "No se pueden generar más de 5,000 cartones a la vez." };
  }

  // If requested, delete existing cards for this event first
  if (data.deleteExisting) {
    // 1. Get cards that can be deleted (status = 'Disponible')
    const { data: cardsToDelete, error: fetchError } = await supabase
      .from("cards")
      .select("card_number, image_url")
      .eq("company_id", data.company_id)
      .eq("event_id", data.event_id)
      .eq("card_status", "Disponible");

    if (fetchError) {
      console.error("Error fetching cards for deletion:", fetchError);
      return { error: "Error al buscar cartones para eliminar." };
    }

    if (cardsToDelete && cardsToDelete.length > 0) {
      console.log(`Eliminando ${cardsToDelete.length} cartones previos...`);
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
        }
      }

      // 4. Delete from Database (only those that are 'Disponible')
      const { data: deletedRows, error: deleteError } = await supabase
        .from("cards")
        .delete()
        .eq("company_id", data.company_id)
        .eq("event_id", data.event_id)
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
    }
  }

  const cards = [];
  for (let i = data.start; i <= data.end; i++) {
    cards.push({
      company_id: data.company_id,
      event_id: data.event_id,
      card_number: i,
      card_status: "Disponible",
      card_price: data.price,
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
    .eq("company_id", data.company_id)
    .eq("event_id", data.event_id)
    .single();

  if (event && (event.event_cartons_number || 0) < data.end) {
    await supabase
      .from("events")
      .update({ event_cartons_number: data.end })
      .eq("company_id", data.company_id)
      .eq("event_id", data.event_id);
  }

  // Log activity
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "GENERATE_CARDS",
      entity: "cards",
      metadata: {
        company_id: data.company_id,
        event_id: data.event_id,
        range: `${data.start}-${data.end}`,
        count: count,
        price: data.price,
        deleted_previous: data.deleteExisting,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/bingo");
  revalidatePath("/admin");
  return { success: true };
}

export const generateCards = withRole(80, withCompanyAccess(generateCardsInternal, 0));

/**
 * Reassign card type (Virtual/Fisico) and log activity.
 */
async function updateCardTypeInternal(
  companyId: number,
  eventId: string,
  cardNumber: number,
  newType: string,
  officialName: string,
  context: { user: any }
) {
  const { user } = context;
  // Validation with Zod
  const validation = updateCardTypeSchema.safeParse({
    company_id: companyId,
    event_id: eventId,
    card_number: cardNumber,
    new_type: newType,
    official_name: officialName,
  });
  if (!validation.success) {
    return { error: "Datos inválidos: " + validation.error.issues.map(e => e.message).join(", ") };
  }
  const data = validation.data;

  const supabase = await createClient();

  // 1. Get current card data for logging
  const { data: card, error: fetchError } = await supabase
    .from("cards")
    .select("card_type, card_status")
    .eq("company_id", data.company_id)
    .eq("event_id", data.event_id)
    .eq("card_number", data.card_number)
    .single();

  if (fetchError || !card) {
    return { error: "No se encontró el cartón." };
  }

  // 2. Update card type
  const { error: updateError } = await supabase
    .from("cards")
    .update({
      card_type: data.new_type,
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", data.company_id)
    .eq("event_id", data.event_id)
    .eq("card_number", data.card_number);

  if (updateError) {
    return { error: updateError.message };
  }

  // 3. Log activity
  await supabase.from("user_activity_log").insert({
    user_id: user.id,
    action: "REASSIGN_CARD_TYPE",
    entity: "cards",
    metadata: {
      company_id: data.company_id,
      event_id: data.event_id,
      card_number: data.card_number,
      old_type: card.card_type,
      new_type: data.new_type,
      requested_by: data.official_name,
      timestamp: new Date().toISOString(),
    },
  });

  revalidatePath("/admin/bingo");
  revalidatePath("/admin");
  return { success: true };
}

export const updateCardType = withRole(40, withCompanyAccess(updateCardTypeInternal, 0));

/**
 * Reassign card type for a range of cards and log activity.
 */
async function updateCardRangeTypeInternal(
  companyId: number,
  eventId: string,
  start: number,
  end: number,
  newType: string,
  officialName: string,
  context: { user: any }
) {
  const { user } = context;
  // Validation with Zod
  const validation = updateCardRangeTypeSchema.safeParse({
    company_id: companyId,
    event_id: eventId,
    start,
    end,
    new_type: newType,
    official_name: officialName,
  });
  if (!validation.success) {
    return { error: "Datos inválidos: " + validation.error.issues.map(e => e.message).join(", ") };
  }
  const data = validation.data;

  const { authorized, error: accessError } = await requireCompanyAccess(data.company_id);
  if (!authorized) return { error: accessError };

  const supabase = await createClient();

  if (data.start > data.end) {
    return { error: "El rango inicial no puede ser mayor al final." };
  }

  // 1. Update card type in range
  const { error: updateError, data: updatedCards } = await supabase
    .from("cards")
    .update({
      card_type: data.new_type,
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", data.company_id)
    .eq("event_id", data.event_id)
    .gte("card_number", data.start)
    .lte("card_number", data.end)
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
      company_id: data.company_id,
      event_id: data.event_id,
      range: `${data.start}-${data.end}`,
      new_type: data.new_type,
      requested_by: data.official_name,
      updated_count: updatedCards?.length || 0,
      timestamp: new Date().toISOString(),
    },
  });

  revalidatePath("/admin/bingo");
  return { success: true, updated_count: updatedCards?.length || 0 };
}

export const updateCardRangeType = withRole(40, withCompanyAccess(updateCardRangeTypeInternal, 0));

/**
 * Update a single card's details and optionally its PDF image.
 */
async function updateSingleCardInternal(
  companyId: number,
  eventId: string,
  cardNumber: number,
  formData: FormData,
  context: { user: any }
) {
  const { user } = context;
  const rawData = {
    card_type: formData.get("card_type") as string,
    card_status: formData.get("card_status") as string,
    card_price: parseFloat(formData.get("card_price") as string),
    sales_price: formData.get("sales_price") ? parseFloat(formData.get("sales_price") as string) : null,
    sold_by: formData.get("sold_by") as string,
    player_name: formData.get("player_name") as string,
    player_phone_number: formData.get("player_phone_number") as string,
    player_email: formData.get("player_email") as string,
    prize: formData.get("prize") as string,
    comment: formData.get("comment") as string,
    invoice_number: formData.get("invoice_number") as string,
  };

  // Validation with Zod
  const validation = singleCardSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: "Datos inválidos: " + validation.error.issues.map(e => e.message).join(", ") };
  }
  const data = validation.data;

  const supabase = await createClient();

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
    ...data,
    sold_by: sanitizeInput(data.sold_by || ""),
    player_name: sanitizeInput(data.player_name || ""),
    player_phone_number: sanitizeInput(data.player_phone_number || ""),
    player_email: sanitizeInput(data.player_email || ""),
    prize: sanitizeInput(data.prize || ""),
    comment: sanitizeInput(data.comment || ""),
    invoice_number: sanitizeInput(data.invoice_number || ""),
    updated_at: new Date().toISOString(),
  };

  const file = formData.get("file") as File;

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
  revalidatePath("/admin");
  return { success: true };
}

export const updateSingleCard = withRole(40, withCompanyAccess(updateSingleCardInternal, 0));

async function getInvoicesInternal(companyId: number, eventId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .order("invoice_date", { ascending: false });

  if (error) return { error: error.message };
  return { success: true, data };
}

export const getInvoices = withRole(40, withCompanyAccess(getInvoicesInternal, 0));

async function saveInvoiceInternal(formData: FormData, context: { user: any }) {
  const { user } = context;
  const rawData = {
    company_id: parseInt(formData.get("company_id") as string),
    event_id: formData.get("event_id") as string,
    invoice_number: formData.get("invoice_number") as string,
    invoice_date: formData.get("invoice_date") as string,
    customer_name: formData.get("customer_name") as string,
    customer_email: formData.get("customer_email") as string,
    phone_area: formData.get("phone_area") as string,
    phone_number: formData.get("phone_number") as string,
    whatsapp_number: formData.get("whatsapp_number") as string,
    manager_name: formData.get("manager_name") as string,
    cards_number: parseInt(formData.get("cards_number") as string),
    card_price: parseFloat(formData.get("card_price") as string),
    total_amount: parseFloat(formData.get("total_amount") as string),
    payment_method: formData.get("payment_method") as string,
    status: (formData.get("status") as string) || "Pagado",
    associated_cards: JSON.parse((formData.get("associated_cards") as string) || "[]"),
  };

  // Validation with Zod
  const validation = invoiceSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: "Datos inválidos: " + validation.error.issues.map(e => e.message).join(", ") };
  }

  const supabase = await createClient();

  const data = validation.data;
  const invoice_file = formData.get("invoice_file") as File;
  let url_invoice = "";

  // 1. Handle File Upload if present
  if (invoice_file && invoice_file.size > 0) {
    const fileExt = invoice_file.name.split(".").pop();
    const fileName = `${data.invoice_number}_${Date.now()}.${fileExt}`;
    const storagePath = `${data.company_id}/${data.event_id}/${fileName}`;

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
    ...data,
    invoice_number: sanitizeInput(data.invoice_number),
    customer_name: sanitizeInput(data.customer_name),
    customer_email: sanitizeInput(data.customer_email),
    phone_area: sanitizeInput(data.phone_area || ""),
    phone_number: sanitizeInput(data.phone_number || ""),
    whatsapp_number: sanitizeInput(data.whatsapp_number || ""),
    manager_name: sanitizeInput(data.manager_name),
    url_invoice,
    updated_at: new Date().toISOString(),
  };

  // 2. Insert Invoice
  const { error: invoiceError } = await supabase
    .from("invoices")
    .insert([invoiceData]);

  if (invoiceError) return { error: invoiceError.message };

  // 3. Update Associated Cards
  if (data.associated_cards.length > 0) {
    const { error: cardsError } = await supabase
      .from("cards")
      .update({
        card_status: "Vendido",
        invoice_number: data.invoice_number,
        sales_price: data.card_price,
        sold_by: data.manager_name,
        player_name: data.customer_name,
        player_phone_number: data.whatsapp_number,
        player_email: data.customer_email,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", data.company_id)
      .eq("event_id", data.event_id)
      .in("card_number", data.associated_cards);

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
      invoice_number: data.invoice_number,
      event_id: data.event_id,
      customer_name: data.customer_name,
      total_amount: data.total_amount,
      associated_cards: data.associated_cards,
      timestamp: new Date().toISOString(),
    },
  });

  revalidatePath("/admin/bingo");
  revalidatePath("/admin");
  return { success: true };
}

export const saveInvoice = withRole(40, withCompanyAccess(saveInvoiceInternal, 0));

/**
 * Update an existing invoice and associated cards.
 */
async function updateInvoiceInternal(formData: FormData, context: { user: any }) {
  const { user } = context;
  const id = formData.get("id") as string;
  const rawData = {
    company_id: parseInt(formData.get("company_id") as string),
    event_id: formData.get("event_id") as string,
    invoice_number: formData.get("invoice_number") as string,
    invoice_date: formData.get("invoice_date") as string,
    customer_name: formData.get("customer_name") as string,
    customer_email: formData.get("customer_email") as string,
    phone_area: formData.get("phone_area") as string,
    phone_number: formData.get("phone_number") as string,
    whatsapp_number: formData.get("whatsapp_number") as string,
    manager_name: formData.get("manager_name") as string,
    cards_number: parseInt(formData.get("cards_number") as string),
    card_price: parseFloat(formData.get("card_price") as string),
    total_amount: parseFloat(formData.get("total_amount") as string),
    payment_method: formData.get("payment_method") as string,
    status: (formData.get("status") as string) || "Pagado",
    associated_cards: JSON.parse((formData.get("associated_cards") as string) || "[]"),
  };

  // Validation with Zod
  const validation = invoiceSchema.partial().safeParse(rawData);
  if (!validation.success) {
    return { error: "Datos inválidos: " + validation.error.issues.map(e => e.message).join(", ") };
  }

  const data = validation.data;
  const supabase = await createClient();

  // 1. Get current invoice to handle file cleanup if needed
  const { data: currentInvoice } = await supabase
    .from("invoices")
    .select("url_invoice, invoice_number")
    .eq("id", id)
    .single();

  let url_invoice = currentInvoice?.url_invoice || "";

  // 2. Handle File Upload if present
  const invoice_file = formData.get("invoice_file") as File;
  if (invoice_file && invoice_file.size > 0) {
    const fileExt = invoice_file.name.split(".").pop();
    const fileName = `${data.invoice_number}_${Date.now()}.${fileExt}`;
    const storagePath = `${data.company_id}/${data.event_id}/${fileName}`;

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

    // Cleanup: Delete old file from Storage if it exists
    if (currentInvoice?.url_invoice) {
      try {
        const oldUrlParts = currentInvoice.url_invoice.split("/invoices_images/");
        if (oldUrlParts.length > 1) {
          const oldStoragePath = oldUrlParts[1];
          await supabase.storage.from("invoices_images").remove([oldStoragePath]);
        }
      } catch (cleanupError) {
        console.warn("Error cleaning up old invoice:", cleanupError);
      }
    }

    url_invoice = publicUrl;
  }

  const invoiceData = {
    ...data,
    invoice_number: sanitizeInput(data.invoice_number || ""),
    customer_name: sanitizeInput(data.customer_name || ""),
    customer_email: sanitizeInput(data.customer_email || ""),
    phone_area: sanitizeInput(data.phone_area || ""),
    phone_number: sanitizeInput(data.phone_number || ""),
    whatsapp_number: sanitizeInput(data.whatsapp_number || ""),
    manager_name: sanitizeInput(data.manager_name || ""),
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
      .eq("company_id", data.company_id || 0)
      .eq("event_id", data.event_id || "")
      .eq("invoice_number", currentInvoice.invoice_number);
  }

  // Now link the new selection
  if (data.associated_cards && data.associated_cards.length > 0) {
    const { error: cardsError } = await supabase
      .from("cards")
      .update({
        card_status: "Vendido",
        invoice_number: data.invoice_number,
        sales_price: data.card_price,
        sold_by: data.manager_name,
        player_name: data.customer_name,
        player_phone_number: data.whatsapp_number,
        player_email: data.customer_email,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", data.company_id || 0)
      .eq("event_id", data.event_id || "")
      .in("card_number", data.associated_cards);

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
      invoice_number: data.invoice_number,
      event_id: data.event_id,
      customer_name: data.customer_name,
      associated_cards: data.associated_cards,
      timestamp: new Date().toISOString(),
    },
  });

  revalidatePath("/admin/bingo");
  revalidatePath("/admin");
  return { success: true };
}

export const updateInvoice = withRole(40, withCompanyAccess(updateInvoiceInternal, 0));

export const sendWhatsAppAutomation = withRole(40, sendWhatsAppAutomationInternal);

async function deleteInvoiceInternal(id: string, context: { user: any }) {
  const { user } = context;
  const supabase = await createClient();

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
  revalidatePath("/admin");
  return { success: true };
}

export const deleteInvoice = withRole(40, deleteInvoiceInternal);

async function updateInvoiceWhatsAppStatusInternal(id: string, status: string, context: { user: any }) {
  const { user } = context;
  const supabase = await createClient();

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
  revalidatePath("/admin");
  return { success: true };
}

export const updateInvoiceWhatsAppStatus = withRole(40, updateInvoiceWhatsAppStatusInternal);

async function getWhatsAppMessageTemplateInternal() {
  const supabase = await createClient();
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

export const getWhatsAppMessageTemplate = withRole(40, getWhatsAppMessageTemplateInternal);

async function getCardsForInvoiceInternal(
  companyId: number,
  eventId: string,
  invoiceNumber: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .eq("invoice_number", invoiceNumber);

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export const getCardsForInvoice = withRole(40, withCompanyAccess(getCardsForInvoiceInternal, 0));

async function getSellersFromViewInternal(companyId: number, eventId: string) {
  const supabase = await createClient();

  // Try view first
  const { data: viewData, error: viewError } = await supabase
    .from("v_sold_by")
    .select("sold_by")
    .eq("company_id", companyId)
    .eq("event_id", eventId);

  if (!viewError && viewData) {
    return { success: true, data: viewData };
  }

  // Fallback to direct table query
  console.warn(
    "View v_sold_by failed or empty, trying fallback to invoices:",
    viewError?.message,
  );
  const { data: invData, error: invError } = await supabase
    .from("invoices")
    .select("manager_name")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .not("manager_name", "is", null);

  if (invError) return { success: false, error: invError.message };

  // Map manager_name to sold_by for consistency
  return {
    success: true,
    data: invData.map((i) => ({ sold_by: i.manager_name })),
  };
}

export const getSellersFromView = withRole(40, withCompanyAccess(getSellersFromViewInternal, 0));

/**
 * Customers and Promotional Messages actions
 */

async function getCustomersInternal(companyId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_phone_number")
    .select("*")
    .eq("company_id", companyId)
    .order("customer_name");

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export const getCustomers = withRole(40, withCompanyAccess(getCustomersInternal, 0));

async function saveCustomerInternal(payload: {
  id?: number;
  company_id: number;
  customer_name: string;
  phone_number: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_phone_number")
    .upsert(payload)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export const saveCustomer = withRole(40, withCompanyAccess(saveCustomerInternal, 0));

async function deleteCustomerInternal(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_phone_number")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export const deleteCustomer = withRole(40, deleteCustomerInternal);

async function getPromoTemplatesInternal() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .eq("page", "whatsapp message")
    .eq("is_active", true)
    .order("content_order");

  if (error) {
    console.error("Error fetching promo templates:", error);
    return { success: false, error: error.message };
  }

  console.log("Promo templates found:", data?.length);
  return { success: true, data };
}

export const getPromoTemplates = withRole(40, getPromoTemplatesInternal);

async function logPromoMessageInternal(payload: {
  batch_id: string;
  company_id: number;
  customer_name: string;
  phone_number: string;
  message_body: string;
  image_url?: string;
  status: string;
  error_message?: string;
}) {
  const supabase = await createClient();
  console.log("Attempting to log promo message to DB:", payload);
  const { data, error } = await supabase
    .from("whatsapp_promo_logs")
    .insert(payload)
    .select();
  if (error) {
    console.error("DB Error logging promo message:", error);
    return { success: false, error: error.message };
  }
  console.log("DB Success logging promo message:", data);
  return { success: true };
}

export const logPromoMessage = withRole(40, logPromoMessageInternal);

async function getBatchLogsInternal(companyId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_promo_batch_summary")
    .select("*")
    .eq("company_id", companyId)
    .order("started_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export const getBatchLogs = withRole(40, withCompanyAccess(getBatchLogsInternal, 0));

async function getBatchDetailsInternal(batchId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("whatsapp_promo_logs")
    .select("*")
    .eq("batch_id", batchId)
    .order("created_at");

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export const getBatchDetails = withRole(40, getBatchDetailsInternal);

async function syncCustomersInternal() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("sync_customers_from_cards");
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export const syncCustomers = withRole(80, syncCustomersInternal);

async function uploadPromoImageInternal(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get("file") as File;
  const companyId = formData.get("company_id");

  if (!file)
    return { success: false, error: "No se proporcionó ningún archivo." };

  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const storagePath = `promos/${companyId}/${fileName}`;

  try {
    const { data, error: uploadError } = await supabase.storage
      .from("cms_images")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("cms_images").getPublicUrl(storagePath);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error("Error uploading promo image:", error);
    return { success: false, error: error.message };
  }
}

export const uploadPromoImage = withRole(40, uploadPromoImageInternal);

async function sendWhatsAppAutomationInternal(payload: {
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
