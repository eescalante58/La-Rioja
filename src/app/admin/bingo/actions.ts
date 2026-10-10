"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
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
  updateCardRangePlayerSchema,
  singleCardSchema 
} from "@/lib/validation/bingo";
import {
  getInvoicesCore,
  getNextAutoInvoiceNumberCore,
  saveInvoiceCore,
  checkCardsRangeCore,
  getSellersCore,
  getEventCardsCore,
  getCardsForInvoiceCore,
  updateInvoiceCore,
  deleteInvoiceCore,
} from "./invoice-core";
import {
  getWhatsAppMessageTemplateCore,
  updateInvoiceWhatsAppStatusCore,
  checkWhatsAppInstanceStatusCore,
  sendWhatsAppAutomationCore,
} from "./whatsapp-core";
import { getCustomersCore } from "../dashboard-core";
import { getErrorMessage } from "@/lib/utils";

/**
 * Sanitizes string input for Bingo operations.
 */
function sanitizeInput(str: string): string {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, ""); // Strips all HTML tags for safety
}

/**
 * Formats a string to Title Case (SQL INITCAP equivalent).
 */
function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Upload card images and create card records.
 */
/**
 * Upload a batch of card images and create their records in the database.
 * Highly optimized: uploads files in parallel to storage, then bulk upserts all cards in ONE single SQL query.
 */
async function uploadCardsBatchInternal(
  companyId: number,
  eventId: string,
  cardPrice: number,
  cardType: string,
  formData: FormData,
  context: { user: any }
) {
  const supabase = await createClient();
  const normalizedCardType =
    cardType === "Fisico" || cardType === "Físico" || formData.get("card_type") === "Fisico" || formData.get("card_type") === "Físico"
      ? "Fisico"
      : cardType === "Ticket ruleta"
        ? "Ticket ruleta"
        : "Virtual";

  const files = (formData.getAll("files") as File[]).sort((a, b) => {
    const matchA = a.name.match(/_Carton_(\d+)\.pdf$/i);
    const matchB = b.name.match(/_Carton_(\d+)\.pdf$/i);
    const numA = matchA ? parseInt(matchA[1], 10) : 0;
    const numB = matchB ? parseInt(matchB[1], 10) : 0;
    return numA - numB;
  });

  if (!files || files.length === 0) {
    return { success: true, successCount: 0, errorCount: 0, errors: [] };
  }

  const uploadedStoragePaths: string[] = [];
  const errors: string[] = [];
  const cardsToUpsert: any[] = [];
  let maxCardNumber: number | null = null;
  let minCardNumber: number | null = null;

  // 1. Upload files concurrently to Storage
  const uploadPromises = files.map(async (file) => {
    const fileName = file.name;
    const match = fileName.match(/^SERIAL_(\d{14})_Carton_(\d+)\.pdf$/i);
    if (!match) {
      return { error: `Archivo ${fileName}: El nombre no sigue el patrón SERIAL_EventoID_Carton_Numero.pdf` };
    }

    const fileEventId = match[1];
    const cardNumber = parseInt(match[2]);

    if (fileEventId !== eventId) {
      return { error: `Archivo ${fileName}: El ID de evento (${fileEventId}) no coincide con el seleccionado.` };
    }

    const storagePath = `${companyId}/${eventId}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("cards_images")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      return { error: `Archivo ${fileName}: Error al subir a Storage (${uploadError.message})` };
    }

    uploadedStoragePaths.push(storagePath);

    const {
      data: { publicUrl },
    } = supabase.storage.from("cards_images").getPublicUrl(storagePath);

    return {
      card: {
        company_id: companyId,
        event_id: eventId,
        card_number: cardNumber,
        card_price: cardPrice,
        card_type: normalizedCardType,
        card_status: "Disponible",
        image_url: publicUrl,
        updated_at: new Date().toISOString(),
      },
      cardNumber,
    };
  });

  const uploadResults = await Promise.all(uploadPromises);

  for (const res of uploadResults) {
    if ("error" in res && res.error) {
      errors.push(res.error);
    } else if ("card" in res && res.card) {
      cardsToUpsert.push(res.card);
      if (maxCardNumber === null || res.cardNumber > maxCardNumber) {
        maxCardNumber = res.cardNumber;
      }
      if (minCardNumber === null || res.cardNumber < minCardNumber) {
        minCardNumber = res.cardNumber;
      }
    }
  }

  // 2. Bulk upsert all cards in a single database query
  if (cardsToUpsert.length > 0) {
    const { error: dbError } = await supabase.from("cards").upsert(cardsToUpsert, {
      onConflict: "company_id,event_id,card_number",
    });

    if (dbError) {
      if (uploadedStoragePaths.length > 0) {
        await supabase.storage.from("cards_images").remove(uploadedStoragePaths);
      }
      return {
        success: false,
        error: `Error al registrar en BD: ${dbError.message}`,
        successCount: 0,
        errorCount: files.length,
        errors: [`Error en BD: ${dbError.message}`],
      };
    }
  }

  return {
    success: true,
    successCount: cardsToUpsert.length,
    errorCount: errors.length,
    errors,
    maxCardNumber,
    minCardNumber,
  };
}

export const uploadCardsBatch = withRole(4, withCompanyAccess(uploadCardsBatchInternal, 0));

/**
 * Upload a single card image and create its record in the database.
 * Kept for single-card fallback.
 */
async function uploadSingleCardImageInternal(
  companyId: number,
  eventId: string,
  cardPrice: number,
  cardType: string,
  fileName: string,
  file: File,
  context: { user: any }
) {
  const { user } = context;
  const supabase = await createClient();
  const normalizedCardType =
    cardType === "Fisico" || cardType === "Físico"
      ? "Fisico"
      : cardType === "Ticket ruleta"
        ? "Ticket ruleta"
        : "Virtual";

  try {
    // 1. Extract info from filename
    const match = fileName.match(/^SERIAL_(\d{14})_Carton_(\d+)\.pdf$/i);
    if (!match) {
      return { error: `Archivo ${fileName}: El nombre no sigue el patrón SERIAL_EventoID_Carton_Numero.pdf` };
    }

    const fileEventId = match[1];
    const cardNumber = parseInt(match[2]);

    // 2. Basic validations
    if (fileEventId !== eventId) {
      return { error: `Archivo ${fileName}: El ID de evento del archivo (${fileEventId}) no coincide con el seleccionado.` };
    }

    // 3. Upload to Storage
    const storagePath = `${companyId}/${eventId}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("cards_images")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      return { error: `Archivo ${fileName}: Error al subir al bucket (${uploadError.message}).` };
    }

    // 4. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from("cards_images")
      .getPublicUrl(storagePath);

    // 5. Create record in DB
    const { error: insertError } = await supabase.from("cards").upsert({
      company_id: companyId,
      event_id: eventId,
      card_number: cardNumber,
      card_price: cardPrice,
      card_type: normalizedCardType,
      card_status: "Disponible",
      image_url: publicUrl,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "company_id,event_id,card_number"
    });

    if (insertError) {
      // Rollback storage if DB fails
      await supabase.storage.from("cards_images").remove([storagePath]);
      return { error: `Archivo ${fileName}: Error al crear registro en BD (${insertError.message}).` };
    }

    return { success: true, cardNumber };
  } catch (err) {
    return { error: `Archivo ${fileName}: Error inesperado (${getErrorMessage(err)}).` };
  }
}

export const uploadSingleCardImage = withRole(4, withCompanyAccess(uploadSingleCardImageInternal, 0));

/**
 * Delete 'Disponible' cards for an event within a specified range before a new upload batch.
 */
async function clearEventCardsInternal(
  companyId: number,
  eventId: string,
  start?: number | any,
  end?: number | any,
  ...rest: any[]
) {
  const parsedStart = typeof start === "number" && !isNaN(start) ? start : undefined;
  const parsedEnd = typeof end === "number" && !isNaN(end) ? end : undefined;

  const supabase = await createClient();
  let query = supabase
    .from("cards")
    .select("card_number, image_url")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .eq("card_status", "Disponible");

  if (parsedStart !== undefined) {
    query = query.gte("card_number", parsedStart);
  }
  if (parsedEnd !== undefined) {
    query = query.lte("card_number", parsedEnd);
  }

  const { data: cardsToDelete, error: fetchError } = await query;

  if (fetchError) return { error: fetchError.message };

  if (cardsToDelete && cardsToDelete.length > 0) {
    const filesToDelete = cardsToDelete
      .map((c) => {
        if (!c.image_url) return null;
        try {
          const urlParts = c.image_url.split("/cards_images/");
          return urlParts.length > 1 ? urlParts[1] : null;
        } catch (e) { return null; }
      })
      .filter((path): path is string => path !== null);

    if (filesToDelete.length > 0) {
      // Delete in parallel chunks of 100 to maximize throughput and avoid timeouts
      const chunkSize = 100;
      const chunks: string[][] = [];
      for (let i = 0; i < filesToDelete.length; i += chunkSize) {
        chunks.push(filesToDelete.slice(i, i + chunkSize));
      }
      await Promise.all(
        chunks.map((chunk) => supabase.storage.from("cards_images").remove(chunk))
      );
    }

    let deleteQuery = supabase
      .from("cards")
      .delete()
      .eq("company_id", companyId)
      .eq("event_id", eventId)
      .eq("card_status", "Disponible");

    if (parsedStart !== undefined) {
      deleteQuery = deleteQuery.gte("card_number", parsedStart);
    }
    if (parsedEnd !== undefined) {
      deleteQuery = deleteQuery.lte("card_number", parsedEnd);
    }

    const { error: dbError } = await deleteQuery;

    if (dbError) return { error: dbError.message };
  }

  return { success: true };
}

export const clearEventCards = withRole(4, withCompanyAccess(clearEventCardsInternal, 0));

/**
 * Log the summary of an upload operation.
 */
async function logUploadActivityInternal(
  companyId: number,
  eventId: string,
  metadata: any,
  context: { user: any }
) {
  const { user } = context;
  const supabase = await createClient();

  if (user) {
    // Update event cartons count based on actual cards in DB
    const { data: cards } = await supabase
      .from("cards")
      .select("card_number")
      .eq("company_id", companyId)
      .eq("event_id", eventId);

    if (cards && cards.length > 0) {
      const maxCardNumber = Math.max(...cards.map((c) => Number(c.card_number)));
      await supabase
        .from("events")
        .update({ event_cartons_number: maxCardNumber })
        .eq("company_id", companyId)
        .eq("event_id", eventId);
    }

    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "UPLOAD_CARDS_IMAGES",
      entity: "cards",
      metadata: {
        company_id: companyId,
        event_id: eventId,
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });
  }
  
  revalidatePath("/admin/bingo");
  return { success: true };
}

export const logUploadActivity = withRole(4, withCompanyAccess(logUploadActivityInternal, 0));

/**
 * Verifies the number of cards in the database for a given event.
 */
async function verifyUploadInternal(
  companyId: number,
  eventId: string,
  context: { user: any }
) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("cards")
    .select("*", { count: 'exact', head: true })
    .eq("company_id", companyId)
    .eq("event_id", eventId);

  if (error) return { error: error.message };
  return { success: true, count: count || 0 };
}

export const verifyUpload = withRole(4, withCompanyAccess(verifyUploadInternal, 0));

async function getBingoDataInternal(context: { user: any, level: number }) {
  const { user, level } = context;
  const supabase = await createClient();

  // Los eventos se acotan a la empresa activa (cookie selected_company_id);
  // sin esto, un usuario multi-empresa veía los eventos de todas sus
  // empresas en el listado de Gestión de Bingo.
  const cookieStore = await cookies();
  const selectedCompanyId = Number(
    cookieStore.get("selected_company_id")?.value,
  );

  // If not Super Admin (100), only fetch data for the companies the user belongs to
  let eventsQuery = supabase.from("events").select("*");
  let companiesQuery = supabase
    .from("companies")
    .select("company_id, company_name, def_dash_event_id");

  if (level < 10) {
    const { data: memberships } = await supabase
      .from("user_companies")
      .select("company_id")
      .eq("user_id", user?.id);

    const companyIds = memberships?.map((m) => m.company_id) || [];

    // La cookie es manipulable por el cliente: solo se respeta si la
    // empresa seleccionada pertenece al usuario; si no, se acota a sus
    // membresías.
    if (companyIds.includes(selectedCompanyId)) {
      eventsQuery = eventsQuery.eq("company_id", selectedCompanyId);
    } else {
      eventsQuery = eventsQuery.in("company_id", companyIds);
    }
    companiesQuery = companiesQuery.in("company_id", companyIds);
  } else if (!Number.isNaN(selectedCompanyId)) {
    eventsQuery = eventsQuery.eq("company_id", selectedCompanyId);
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

export const getBingoData = withRole(4, getBingoDataInternal);

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
    event_venue: (formData.get("event_venue") as string) || null,
    Method_of_payment: (formData.get("Method_of_payment") as string) || null,
    event_goal: formData.get("event_goal") ? parseFloat(formData.get("event_goal") as string) : null,
    event_cartons_number: formData.get("event_cartons_number") ? parseInt(formData.get("event_cartons_number") as string) : null,
    event_start_promotion_date: formData.get("event_start_promotion_date") || null,
  };

  // Add is_active logic based on status
  const finalRawData = {
    ...rawData,
    is_active: rawData.status === "Activo",
  };

  // Validation with Zod
  const validation = eventSchema.safeParse(finalRawData);
  if (!validation.success) {
    return { error: "Datos inválidos: " + validation.error.issues.map(e => e.message).join(", ") };
  }
  const eventData = {
    ...validation.data,
    event_id: sanitizeInput(validation.data.event_id),
    event_name: sanitizeInput(validation.data.event_name),
    event_venue: validation.data.event_venue ? sanitizeInput(validation.data.event_venue) : null,
    Method_of_payment: validation.data.Method_of_payment ? sanitizeInput(validation.data.Method_of_payment) : null,
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

export const saveEvent = withRole(
  4,
  withCompanyAccess(saveEventInternal, 0),
);

/**
 * Delete a Bingo event.
 */
async function deleteEventInternal(id: number, context: { user: any }) {
  const { user } = context;
  const supabase = await createClient();

  // Get event details before deleting for the log; company_id validates
  // que el usuario sea miembro de la empresa dueña del evento.
  const { data: event } = await supabase
    .from("events")
    .select("event_name, event_id, company_id")
    .eq("id", id)
    .single();

  if (!event) {
    return { error: "El evento no existe." };
  }

  const { authorized, error: accessError } = await requireCompanyAccess(
    event.company_id,
  );
  if (!authorized) {
    return { success: false, error: accessError || "Acceso denegado" };
  }

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

export const deleteEvent = withRole(4, deleteEventInternal);

/**
 * Obtiene todas las filas de una tabla filtradas por empresa/evento,
 * paginando en bloques de 1000 (límite por consulta de PostgREST).
 */
async function fetchAllRows(
  supabase: any,
  table: string,
  columns: string,
  companyId: number,
  eventId: string,
  orderBy: string,
) {
  const pageSize = 1000;
  const firstPage = await supabase
    .from(table)
    .select(columns, { count: "exact" })
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .order(orderBy, { ascending: true })
    .range(0, pageSize - 1);
  if (firstPage.error) return { data: null, error: firstPage.error };

  const all: any[] = [...(firstPage.data || [])];
  const total = firstPage.count ?? all.length;
  if (total <= pageSize) return { data: all, error: null as any };

  const rest = await Promise.all(
    Array.from({ length: Math.ceil(total / pageSize) - 1 }, (_, i) =>
      supabase
        .from(table)
        .select(columns)
        .eq("company_id", companyId)
        .eq("event_id", eventId)
        .order(orderBy, { ascending: true })
        .range((i + 1) * pageSize, (i + 2) * pageSize - 1),
    ),
  );
  for (const res of rest) {
    if (res.error) return { data: null, error: res.error };
    all.push(...(res.data || []));
  }
  return { data: all, error: null as any };
}

async function getEventCardsInternal(companyId: number, eventId: string) {
  return getEventCardsCore(companyId, eventId);
}

export const getEventCards = withRole(4, withCompanyAccess(getEventCardsInternal, 0));

async function generateCardsInternal(
  companyId: number,
  eventId: string,
  start: number,
  end: number,
  price: number,
  cardType: "Virtual" | "Fisico" | "Ticket ruleta",
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
    card_type: cardType,
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

  // If requested, delete existing cards for this event within the specified range first
  if (data.deleteExisting) {
    // 1. Get cards that can be deleted (status = 'Disponible') within range
    const { data: cardsToDelete, error: fetchError } = await supabase
      .from("cards")
      .select("card_number, image_url")
      .eq("company_id", data.company_id)
      .eq("event_id", data.event_id)
      .eq("card_status", "Disponible")
      .gte("card_number", data.start)
      .lte("card_number", data.end);

    if (fetchError) {
      console.error("Error fetching cards for deletion:", fetchError);
      return { error: "Error al buscar cartones para eliminar." };
    }

    if (cardsToDelete && cardsToDelete.length > 0) {
      console.log(`Eliminando ${cardsToDelete.length} cartones previos en rango ${data.start}-${data.end}...`);
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
        // Delete in chunks of 100 to avoid timeouts
        const chunkSize = 100;
        for (let i = 0; i < filesToDelete.length; i += chunkSize) {
          const chunk = filesToDelete.slice(i, i + chunkSize);
          await supabase.storage.from("cards_images").remove(chunk);
        }
      }

      // 4. Delete from Database (only those that are 'Disponible' in the range)
      const { data: deletedRows, error: deleteError } = await supabase
        .from("cards")
        .delete()
        .eq("company_id", data.company_id)
        .eq("event_id", data.event_id)
        .eq("card_status", "Disponible")
        .gte("card_number", data.start)
        .lte("card_number", data.end)
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
      card_type: data.card_type,
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

  // Log activity
  if (user) {
    // Update event cartons count based on actual cards in DB
    const { data: cardsRes } = await supabase
      .from("cards")
      .select("card_number")
      .eq("company_id", data.company_id)
      .eq("event_id", data.event_id);

    if (cardsRes && cardsRes.length > 0) {
      const maxCardNumber = Math.max(...cardsRes.map((c) => Number(c.card_number)));
      await supabase
        .from("events")
        .update({ event_cartons_number: maxCardNumber })
        .eq("company_id", data.company_id)
        .eq("event_id", data.event_id);
    }

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

export const generateCards = withRole(4, withCompanyAccess(generateCardsInternal, 0));

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

export const updateCardType = withRole(4, withCompanyAccess(updateCardTypeInternal, 0));

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

export const updateCardRangeType = withRole(4, withCompanyAccess(updateCardRangeTypeInternal, 0));

/**
 * Reassign player name and phone for a range of cards and log activity.
 */
async function updateCardRangePlayerInternal(
  companyId: number,
  eventId: string,
  start: number,
  end: number,
  playerName: string,
  playerPhone: string,
  officialName: string,
  context: { user: any }
) {
  const { user } = context;
  const validation = updateCardRangePlayerSchema.safeParse({
    company_id: companyId,
    event_id: eventId,
    start,
    end,
    player_name: playerName,
    player_phone_number: playerPhone,
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

  const { error: updateError, data: updatedCards } = await supabase
    .from("cards")
    .update({
      player_name: sanitizeInput(data.player_name),
      player_phone_number: sanitizeInput(data.player_phone_number),
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

  await supabase.from("user_activity_log").insert({
    user_id: user.id,
    action: "REASSIGN_CARD_RANGE_PLAYER",
    entity: "cards",
    metadata: {
      company_id: data.company_id,
      event_id: data.event_id,
      range: `${data.start}-${data.end}`,
      player_name: data.player_name,
      player_phone_number: data.player_phone_number,
      requested_by: data.official_name,
      updated_count: updatedCards?.length || 0,
      timestamp: new Date().toISOString(),
    },
  });

  revalidatePath("/admin/bingo");
  return { success: true, updated_count: updatedCards?.length || 0 };
}

export const updateCardRangePlayer = withRole(4, withCompanyAccess(updateCardRangePlayerInternal, 0));

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

  // El diálogo de edición solo envía un subconjunto de campos (datos del
  // jugador). Se construye rawData únicamente con lo presente en el
  // FormData y se valida con el esquema parcial para no exigir campos
  // que el formulario no envía ni sobrescribirlos con null.
  const rawData: Record<string, any> = {};
  formData.forEach((value, key) => {
    if (key !== "file") rawData[key] = value;
  });
  if (rawData.card_price !== undefined) {
    rawData.card_price = parseFloat(rawData.card_price as string);
  }
  if (rawData.sales_price !== undefined) {
    rawData.sales_price = rawData.sales_price
      ? parseFloat(rawData.sales_price as string)
      : null;
  }

  // Validation with Zod (parcial: solo campos enviados)
  const validation = singleCardSchema.partial().safeParse(rawData);
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

  const updates: any = { updated_at: new Date().toISOString() };
  const sanitizedKeys = [
    "sold_by",
    "player_name",
    "player_phone_number",
    "player_email",
    "prize",
    "comment",
    "invoice_number",
  ] as const;
  for (const key of sanitizedKeys) {
    if (data[key] !== undefined) {
      updates[key] = sanitizeInput(data[key] || "");
    }
  }
  for (const key of ["card_type", "card_status", "card_price", "sales_price"] as const) {
    if (data[key] !== undefined) {
      updates[key] = data[key];
    }
  }

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

export const updateSingleCard = withRole(4, withCompanyAccess(updateSingleCardInternal, 0));

// La lógica de facturación vive en invoice-core.ts: las Server Actions
// re-renderizan esta página completa (~minutos), así que la operativa de
// alta frecuencia del evento va por los Route Handlers /api/bingo/* que
// comparten las mismas funciones core.
async function getInvoicesInternal(companyId: number, eventId: string) {
  return getInvoicesCore(companyId, eventId);
}

export const getInvoices = withRole(4, withCompanyAccess(getInvoicesInternal, 0));

/**
 * Siguiente número de factura automático con prefijo "FactAut-"
 * (secuencial por empresa+evento: FactAut-000001, FactAut-000002…).
 * Los dígitos se extraen del sufijo de los invoice_number existentes.
 */
async function getNextAutoInvoiceNumberInternal(
  companyId: number,
  eventId: string,
) {
  return getNextAutoInvoiceNumberCore(companyId, eventId);
}

export const getNextAutoInvoiceNumber = withRole(
  4,
  withCompanyAccess(getNextAutoInvoiceNumberInternal, 0),
);

/**
 * Delega en invoice-core.ts (misma lógica que sirve POST /api/bingo/invoices).
 * Aquí sí se revalidan las páginas afectadas porque la acción se usa en
 * flujos admin de menor frecuencia (editar/detalle).
 */
async function saveInvoiceInternal(formData: FormData, context: { user: any }) {
  const result = await saveInvoiceCore(formData, context.user?.id);
  if ((result as any)?.success) {
    revalidatePath("/admin/bingo");
    revalidatePath("/admin");
  }
  return result;
}

export const saveInvoice = withRole(4, withCompanyAccess(saveInvoiceInternal, 0));

/**
 * Update an existing invoice and associated cards.
 * La lógica vive en invoice-core.ts (compartida con PUT /api/bingo/invoices).
 */
async function updateInvoiceInternal(formData: FormData, context: { user: any }) {
  const result = await updateInvoiceCore(formData, context.user?.id);
  if ((result as any)?.success) {
    revalidatePath("/admin/bingo");
    revalidatePath("/admin");
  }
  return result;
}

export const updateInvoice = withRole(4, withCompanyAccess(updateInvoiceInternal, 0));

/**
 * Checks if cards in a given range are available for a company/event.
 * Verifies that each card is neither "Vendido" nor "Anulado".
 */
async function checkCardsRangeInternal(
  companyId: number,
  eventId: string,
  start: number,
  end: number,
  context: { user: any }
) {
  return checkCardsRangeCore(companyId, eventId, start, end);
}

export const checkCardsRange = withRole(4, withCompanyAccess(checkCardsRangeInternal, 0));

export const sendWhatsAppAutomation = withRole(
  4,
  sendWhatsAppAutomationInternal,
);

/**
 * Delete an invoice and release its associated cards.
 * La lógica vive en invoice-core.ts (compartida con DELETE /api/bingo/invoices).
 */
async function deleteInvoiceInternal(id: string, context: { user: any }) {
  const result = await deleteInvoiceCore(id, context.user?.id);
  if ((result as any)?.success) {
    revalidatePath("/admin/bingo");
    revalidatePath("/admin");
  }
  return result;
}

export const deleteInvoice = withRole(4, deleteInvoiceInternal);

async function updateInvoiceWhatsAppStatusInternal(id: string, status: string, context: { user: any }) {
  const result = await updateInvoiceWhatsAppStatusCore(
    id,
    status,
    context.user?.id,
  );
  if (result?.success) {
    revalidatePath("/admin/bingo");
    revalidatePath("/admin");
  }
  return result;
}

export const updateInvoiceWhatsAppStatus = withRole(4, updateInvoiceWhatsAppStatusInternal);

async function getWhatsAppMessageTemplateInternal() {
  return getWhatsAppMessageTemplateCore();
}

export const getWhatsAppMessageTemplate = withRole(4, getWhatsAppMessageTemplateInternal);

async function getCardsForInvoiceInternal(
  companyId: number,
  eventId: string,
  invoiceNumber: string,
) {
  return getCardsForInvoiceCore(companyId, eventId, invoiceNumber);
}

export const getCardsForInvoice = withRole(4, withCompanyAccess(getCardsForInvoiceInternal, 0));

async function getSellersFromViewInternal(companyId: number, eventId: string) {
  return getSellersCore(companyId, eventId);
}

export const getSellersFromView = withRole(4, withCompanyAccess(getSellersFromViewInternal, 0));

/**
 * Customers and Promotional Messages actions
 */

async function getCustomersInternal(companyId: number) {
  return getCustomersCore(companyId);
}

export const getCustomers = withRole(4, withCompanyAccess(getCustomersInternal, 0));

async function saveCustomerInternal(payload: {
  id?: number;
  company_id: number;
  customer_name: string;
  phone_number: string;
}) {
  const supabase = createAdminClient();

  // Si no hay id (cliente nuevo), se omite para que upsert haga INSERT
  const { id, ...rest } = payload;
  const record = id ? { id, ...rest } : rest;

  const { data, error } = await supabase
    .from("customer_phone_number")
    .upsert(record)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export const saveCustomer = withRole(4, withCompanyAccess(saveCustomerInternal, 0));

async function deleteCustomerInternal(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_phone_number")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export const deleteCustomer = withRole(4, deleteCustomerInternal);

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

export const getPromoTemplates = withRole(4, getPromoTemplatesInternal);

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

export const logPromoMessage = withRole(4, logPromoMessageInternal);

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

export const getBatchLogs = withRole(4, withCompanyAccess(getBatchLogsInternal, 0));

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

export const getBatchDetails = withRole(4, getBatchDetailsInternal);

/**
 * Sincroniza clientes promocionales desde dos fuentes:
 * 1. Facturas (invoices) del evento por defecto de la empresa
 *    (companies.def_dash_event_id).
 * 2. Jugadores registrados en los cartones (cards) del mismo evento.
 * Inserta en customer_phone_number solo los teléfonos que no existan aún.
 * Registra en table_data_source el origen del dato:
 * "invoices", "cards" o "ambas" si el teléfono aparece en ambas fuentes.
 */
async function syncCustomersInternal(companyId: number) {
  const supabase = createAdminClient();

  // 1. Obtener el evento por defecto de la empresa
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("def_dash_event_id")
    .eq("company_id", companyId)
    .single();

  if (companyError) return { success: false, error: companyError.message };
  if (!company?.def_dash_event_id) {
    return {
      success: false,
      error:
        "La empresa no tiene un evento por defecto configurado (def_dash_event_id).",
    };
  }

  // 2. Obtener facturas del evento por defecto y jugadores de cartones
  //    (paginado: el evento puede superar el límite de 1000 filas por consulta)
  const [invRes, cardsRes] = await Promise.all([
    fetchAllRows(
      supabase,
      "invoices",
      "customer_name, whatsapp_number, phone_area, phone_number",
      companyId,
      company.def_dash_event_id,
      "invoice_number",
    ),
    fetchAllRows(
      supabase,
      "cards",
      "player_name, player_phone_number",
      companyId,
      company.def_dash_event_id,
      "card_number",
    ),
  ]);

  if (invRes.error) return { success: false, error: invRes.error.message };
  if (cardsRes.error) return { success: false, error: cardsRes.error.message };

  // 3. Construir lista única de clientes por teléfono, rastreando la fuente
  //    Facturas: prioriza whatsapp_number; si no, usa phone_area + phone_number
  //    Cartones: usa player_phone_number
  const phoneMap = new Map<string, { name: string; sources: Set<string> }>();
  const addPhone = (phone: string, name: string, source: string) => {
    const entry = phoneMap.get(phone);
    if (entry) {
      entry.sources.add(source);
    } else if (phone && name) {
      phoneMap.set(phone, { name, sources: new Set([source]) });
    }
  };
  for (const inv of invRes.data || []) {
    const rawPhone =
      (inv.whatsapp_number || "").trim() ||
      `${inv.phone_area || ""}${inv.phone_number || ""}`.trim();
    addPhone(
      rawPhone.replace(/\D/g, ""),
      (inv.customer_name || "").trim(),
      "invoices",
    );
  }
  for (const card of cardsRes.data || []) {
    addPhone(
      (card.player_phone_number || "").replace(/\D/g, ""),
      (card.player_name || "").trim(),
      "cards",
    );
  }

  if (phoneMap.size === 0) {
    return { success: true, imported: 0, updated: 0 };
  }

  const sourceLabel = (sources: Set<string>) =>
    sources.size > 1 ? "ambas" : [...sources][0];

  // 4. Obtener teléfonos ya registrados para evitar duplicados
  const { data: existing, error: existError } = await supabase
    .from("customer_phone_number")
    .select("id, phone_number, table_data_source")
    .eq("company_id", companyId);

  if (existError) return { success: false, error: existError.message };

  const existingPhones = new Set(
    (existing || []).map((c: any) =>
      (c.phone_number || "").replace(/\D/g, ""),
    ),
  );

  // 5. Insertar solo teléfonos nuevos, con su fuente de origen
  const toInsert = [...phoneMap.entries()]
    .filter(([phone]) => !existingPhones.has(phone))
    .map(([phone, entry]) => ({
      company_id: companyId,
      customer_name: entry.name,
      phone_number: phone,
      table_data_source: sourceLabel(entry.sources),
    }));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("customer_phone_number")
      .insert(toInsert);
    if (insertError) return { success: false, error: insertError.message };
  }

  // 6. Actualizar table_data_source de registros existentes cuyo teléfono
  //    ahora también aparece en la otra fuente (ej. "invoices" -> "ambas")
  const parseSources = (value: string | null): Set<string> => {
    if (value === "ambas") return new Set(["invoices", "cards"]);
    return new Set(
      (value || "").split(/[,+|]/).filter((s) => s === "invoices" || s === "cards"),
    );
  };

  let updated = 0;
  const updates = (existing || [])
    .map((row: any) => {
      const phone = (row.phone_number || "").replace(/\D/g, "");
      const entry = phoneMap.get(phone);
      if (!entry) return null;
      const merged = parseSources(row.table_data_source);
      entry.sources.forEach((s) => merged.add(s));
      const label = merged.size > 0 ? sourceLabel(merged) : null;
      return label !== row.table_data_source ? { id: row.id, label } : null;
    })
    .filter(Boolean) as { id: number; label: string }[];

  for (const u of updates) {
    const { error: updateError } = await supabase
      .from("customer_phone_number")
      .update({ table_data_source: u.label })
      .eq("id", u.id);
    if (updateError) return { success: false, error: updateError.message };
    updated++;
  }

  return { success: true, imported: toInsert.length, updated };
}

export const syncCustomers = withRole(
  4,
  withCompanyAccess(syncCustomersInternal, 0),
);

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
  } catch (error) {
    console.error("Error uploading promo image:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

export const uploadPromoImage = withRole(4, uploadPromoImageInternal);

// La lógica de Ultramsg vive en whatsapp-core.ts (compartida con
// POST /api/bingo/whatsapp); aquí solo quedan las delegaciones.
async function checkWhatsAppInstanceStatusInternal() {
  return checkWhatsAppInstanceStatusCore();
}

export const checkWhatsAppInstanceStatus = withRole(
  4,
  checkWhatsAppInstanceStatusInternal,
);

async function sendWhatsAppAutomationInternal(payload: {
  to: string;
  message: string;
  templateImage?: string;
  invoiceUrl?: string;
  cardUrls: string[];
}) {
  return sendWhatsAppAutomationCore(payload);
}
