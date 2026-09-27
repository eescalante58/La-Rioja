import { createAdminClient } from "@/lib/supabase/server";
import { invoiceSchema } from "@/lib/validation/bingo";

/**
 * Lógica de facturación compartida entre las Server Actions de
 * /admin/bingo/actions.ts y los Route Handlers de /api/bingo/*.
 *
 * Las Server Actions re-renderizan la página RSC completa en cada
 * respuesta y /admin/bingo es pesada (~minutos); los Route Handlers
 * responden solo JSON, por eso las operaciones de alta frecuencia
 * durante el evento (listar facturas, verificar rango, guardar) se
 * sirven desde /api/bingo usando estas mismas funciones.
 */

/** Sanitiza texto eliminando etiquetas HTML. */
function sanitizeInput(str: string): string {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "");
}

/** Formatea un texto a Title Case (equivalente a INITCAP). */
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
 * Facturas de un evento ordenadas por fecha descendente.
 * Usa el índice idx_invoices_company_event_date.
 */
export async function getInvoicesCore(companyId: number, eventId: string) {
  const supabase = createAdminClient();

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
 * Siguiente número de factura automático con prefijo "FactAut-"
 * (secuencial por empresa+evento: FactAut-000001, FactAut-000002…).
 */
export async function getNextAutoInvoiceNumberCore(
  companyId: number,
  eventId: string,
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .ilike("invoice_number", "FactAut%");

  if (error) return { error: error.message };

  const max = (data || []).reduce((m: number, r: any) => {
    const n = parseInt(String(r.invoice_number).replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);

  return { data: `FactAut-${String(max + 1).padStart(6, "0")}` };
}

/**
 * Crea una factura y marca sus cartones asociados como
 * 'Vendido'/'Donado' en una sola actualización por lote.
 *
 * Secuencia: validación Zod → chequeo de duplicado → (opcional) subida
 * de imagen a Storage → INSERT en invoices → UPDATE masivo en cards
 * → bitácora en user_activity_log.
 */
export async function saveInvoiceCore(formData: FormData, userId: string) {
  const associatedCardsRaw =
    (formData.get("associated_cards") as string) ||
    (formData.get("selected_cards") as string) ||
    "[]";
  let associatedCards: number[] = [];
  try {
    associatedCards = JSON.parse(associatedCardsRaw);
  } catch {
    associatedCards = [];
  }

  const rawData = {
    company_id: parseInt(formData.get("company_id") as string),
    event_id: formData.get("event_id") as string,
    invoice_number: formData.get("invoice_number") as string,
    invoice_date: formData.get("invoice_date") as string,
    customer_name: formData.get("customer_name") as string,
    customer_email: (formData.get("customer_email") as string) || "",
    phone_area: (formData.get("phone_area") as string) || "",
    phone_number: (formData.get("phone_number") as string) || "",
    whatsapp_number: (formData.get("whatsapp_number") as string) || "",
    manager_name: formData.get("manager_name") as string,
    cards_number: parseInt(formData.get("cards_number") as string),
    card_price: parseFloat(formData.get("card_price") as string),
    total_amount: parseFloat(formData.get("total_amount") as string),
    payment_method: (formData.get("payment_method") as string) || "efectivo",
    status: (formData.get("status") as string) || "pagada",
    observation: (formData.get("observation") as string) || "",
    associated_cards: associatedCards,
  };

  const validation = invoiceSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error:
        "Datos inválidos: " +
        validation.error.issues.map((e) => e.message).join(", "),
    };
  }

  const supabase = createAdminClient();
  const data = validation.data;

  // Verificar que el número de factura no esté duplicado en el evento
  const { data: duplicate } = await supabase
    .from("invoices")
    .select("id")
    .eq("company_id", data.company_id)
    .eq("event_id", data.event_id)
    .eq("invoice_number", data.invoice_number)
    .maybeSingle();

  if (duplicate) {
    return {
      error: `Ya existe una factura con el número ${data.invoice_number} en este evento.`,
    };
  }

  const invoice_file = formData.get("invoice_file") as File;
  let url_invoice = null;

  // 1. Subida de imagen/PDF de respaldo (opcional)
  if (invoice_file && invoice_file instanceof File && invoice_file.size > 0) {
    try {
      const fileExt = invoice_file.name.split(".").pop();
      const fileName = `${data.invoice_number}_${Date.now()}.${fileExt}`;
      const storagePath = `${data.company_id}/${data.event_id}/${fileName}`;

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
    } catch (err: any) {
      console.error("Error processing invoice file:", err);
      return { error: `Error procesando archivo de factura: ${err.message}` };
    }
  }

  const { associated_cards, ...invoiceFields } = data;

  const invoiceData = {
    company_id: invoiceFields.company_id,
    event_id: invoiceFields.event_id,
    invoice_number: sanitizeInput(invoiceFields.invoice_number),
    invoice_date: invoiceFields.invoice_date,
    customer_name: toTitleCase(sanitizeInput(invoiceFields.customer_name)),
    customer_email: sanitizeInput(invoiceFields.customer_email || ""),
    phone_area: sanitizeInput(invoiceFields.phone_area || ""),
    phone_number: sanitizeInput(invoiceFields.phone_number || ""),
    whatsapp_number: sanitizeInput(invoiceFields.whatsapp_number || ""),
    manager_name: toTitleCase(sanitizeInput(invoiceFields.manager_name)),
    cards_number: invoiceFields.cards_number,
    // Factura 'Donada': valor de referencia $0 (cartones quedan 'Donado')
    card_price: invoiceFields.status === "Donada" ? 0 : invoiceFields.card_price,
    total_amount:
      invoiceFields.status === "Donada" ? 0 : invoiceFields.total_amount,
    payment_method: invoiceFields.payment_method,
    status: invoiceFields.status,
    observation: sanitizeInput(invoiceFields.observation || ""),
    url_invoice,
    updated_at: new Date().toISOString(),
  };

  // 2. INSERT de la factura
  const { error: invoiceError } = await supabase
    .from("invoices")
    .insert([invoiceData]);

  if (invoiceError) return { error: invoiceError.message };

  // 3. UPDATE masivo de cartones asociados (una sola consulta por lote)
  if (data.associated_cards.length > 0) {
    const { error: cardsError } = await supabase
      .from("cards")
      .update({
        card_status: data.status === "Donada" ? "Donado" : "Vendido",
        invoice_number: data.invoice_number,
        sales_price: data.card_price,
        sold_by: invoiceData.manager_name,
        player_name: invoiceData.customer_name,
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

  // 4. Bitácora
  await supabase.from("user_activity_log").insert({
    user_id: userId,
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

  return { success: true };
}

/**
 * Verifica que los cartones del rango [start, end] existan y estén
 * disponibles (ni "Vendido" ni "Anulado"). La consulta usa el índice
 * único (company_id, event_id, card_number) de cards: es un range scan
 * acotado por los dos equality, no un barrido de tabla.
 */
export async function checkCardsRangeCore(
  companyId: number,
  eventId: string,
  start: number,
  end: number,
) {
  if (start > end) {
    return { error: "El cartón inicial no puede ser mayor al final." };
  }

  const count = end - start + 1;
  if (count > 500) {
    return { error: "El rango no puede ser mayor a 500 cartones." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cards")
    .select("card_number, card_status")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .gte("card_number", start)
    .lte("card_number", end)
    .order("card_number", { ascending: true });

  if (error) return { error: error.message };

  const cardMap = new Map((data || []).map((c) => [c.card_number, c.card_status]));

  const results = [];
  const invalidCards: { card_number: number; status: string }[] = [];

  for (let i = start; i <= end; i++) {
    const status = cardMap.get(i);
    if (!status) {
      invalidCards.push({ card_number: i, status: "No encontrado" });
    } else if (status === "Vendido" || status === "Anulado") {
      invalidCards.push({ card_number: i, status });
    } else {
      results.push({ card_number: i, status });
    }
  }

  if (invalidCards.length > 0) {
    const details = invalidCards
      .map((c) => `#${c.card_number} (${c.status})`)
      .join(", ");
    return {
      success: false,
      error: `Algunos cartones no están disponibles: ${details}`,
      invalidCards,
    };
  }

  return { success: true, data: results };
}

/**
 * Nombres de vendedores del evento (vista v_sold_by; si la vista no
 * existe o falla, se deriva de invoices.manager_name).
 */
export async function getSellersCore(companyId: number, eventId: string) {
  const supabase = createAdminClient();

  const { data: viewData, error: viewError } = await supabase
    .from("v_sold_by")
    .select("sold_by")
    .eq("company_id", companyId)
    .eq("event_id", eventId);

  if (!viewError && viewData) {
    return { success: true, data: viewData };
  }

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

  return {
    success: true,
    data: invData.map((i) => ({ sold_by: i.manager_name })),
  };
}
