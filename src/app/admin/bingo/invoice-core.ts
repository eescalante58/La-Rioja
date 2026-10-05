import { createAdminClient } from "@/lib/supabase/server";
import { invoiceSchema, invoiceUpdateSchema } from "@/lib/validation/bingo";

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
 * Facturas de un evento ordenadas por fecha de creación descendente.
 * Usa el índice idx_invoices_company_event_created_at.
 */
export async function getInvoicesCore(companyId: number, eventId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

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

  // 2. INSERT de la factura (con id para poder revertir si fallan los cartones)
  const { data: insertedInvoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert([invoiceData])
    .select("id")
    .single();

  if (invoiceError) return { error: invoiceError.message };

  // 3. UPDATE masivo de cartones asociados — con guard anti-carrera:
  // solo se reclaman cartones en estado Disponible/Asignado (whitelist:
  // el enum card_status_enum no admite comparar contra valores que no
  // existen, p.ej. "Anulado") y se verifica que el conteo reclamado
  // coincida con lo solicitado. Si dos cajas venden el mismo carton a la
  // vez, la segunda factura se revierte completa.
  if (data.associated_cards.length > 0) {
    const { data: claimed, error: cardsError } = await supabase
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
      .in("card_number", data.associated_cards)
      .in("card_status", ["Disponible", "Asignado"])
      .select("card_number");

    const claimedCount = claimed?.length ?? 0;
    if (cardsError || claimedCount !== data.associated_cards.length) {
      // Rollback: liberar los reclamados parcialmente y borrar la factura
      await releaseInvoiceCards(
        supabase,
        data.company_id,
        data.event_id,
        data.invoice_number,
      );
      if (insertedInvoice?.id) {
        await supabase.from("invoices").delete().eq("id", insertedInvoice.id);
      }

      if (cardsError) {
        return { error: `Error al actualizar cartones: ${cardsError.message}` };
      }
      const claimedSet = new Set((claimed || []).map((c: any) => Number(c.card_number)));
      const conflicted = data.associated_cards.filter(
        (n: number) => !claimedSet.has(Number(n)),
      );
      return {
        error: `Los cartones ${conflicted.join(", ")} acaban de ser vendidos o anulados por otra operación. La factura no fue registrada.`,
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
    } else if (status !== "Disponible" && status !== "Asignado") {
      // Misma whitelist que el guard de vinculación: solo Disponible/Asignado
      // son reclamables por una factura.
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

/**
 * Obtiene todas las filas de una tabla filtradas por empresa/evento.
 * PostgREST limita cada consulta a 1000 filas: se trae la primera página
 * con el conteo exacto y las páginas restantes en paralelo con
 * Promise.all (ORDER BY + range garantizan el orden global), en lugar de
 * las rondas secuenciales que multiplicaban la latencia por página.
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

/**
 * Columnas que consumen los clientes del inventario: tabla del diálogo,
 * sub-diálogos (editar, reasignar tipo/jugador) y el selector de cartones
 * de la edición de factura. SELECT * arrastraba columnas que ningún
 * cliente usa — más JSON a serializar, transferir y parsear por cartón.
 */
const EVENT_CARD_COLUMNS =
  "company_id, event_id, card_number, card_type, card_status, card_price, " +
  "sales_price, invoice_number, player_name, player_phone_number, " +
  "player_email, sold_by, image_url, created_at, updated_at, " +
  // Alumno asignado (estado 'Asignado'): mismo embed que usa el
  // drill-down invoice-cards del dashboard.
  "students_cards(students(student_name, student_level))";

/**
 * Todos los cartones del evento (inventario completo), paginados.
 * Lo usa el diálogo de edición de factura y el tab de inventario.
 */
export async function getEventCardsCore(companyId: number, eventId: string) {
  const supabase = createAdminClient();
  const { data, error } = await fetchAllRows(
    supabase,
    "cards",
    EVENT_CARD_COLUMNS,
    companyId,
    eventId,
    "card_number",
  );
  if (error) return { error: error.message };
  return { success: true, data };
}

/**
 * Informe de cartones por estado dentro de un rango [from, to].
 * Devuelve una fila por cartón con los datos de venta y el nombre del
 * cliente tomado de la factura vinculada (join por invoice_number).
 * Pagina en bloques de 1000 porque el inventario puede superar el
 * límite por consulta de PostgREST.
 */
export async function getCardsStatusReportCore(
  companyId: number,
  eventId: string,
  status: string,
  fromCard: number,
  toCard: number,
) {
  const supabase = createAdminClient();
  const pageSize = 1000;
  const all: Record<string, unknown>[] = [];

  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from("cards")
      .select(
        `
        card_number,
        card_type,
        card_status,
        invoice_number,
        player_name,
        player_phone_number,
        sold_by,
        invoices:invoices ( customer_name )
      `,
      )
      .eq("company_id", companyId)
      .eq("event_id", eventId)
      .gte("card_number", fromCard)
      .lte("card_number", toCard)
      .order("card_number", { ascending: true })
      .range(from, from + pageSize - 1);

    if (status && status !== "Todos") {
      query = query.eq("card_status", status);
    }

    const { data, error } = await query;
    if (error) return { error: error.message };
    all.push(...((data || []) as Record<string, unknown>[]));
    if (!data || data.length < pageSize) break;
  }

  const rows = all.map((r) => ({
    card_number: r.card_number,
    card_type: r.card_type,
    card_status: r.card_status,
    invoice_number: r.invoice_number,
    customer_name:
      (r.invoices as { customer_name?: string } | null)?.customer_name || "",
    player_name: r.player_name,
    player_phone_number: r.player_phone_number,
    sold_by: r.sold_by,
  }));

  return { success: true, data: rows };
}

/** Cartones vinculados a un número de factura del evento. */
export async function getCardsForInvoiceCore(
  companyId: number,
  eventId: string,
  invoiceNumber: string,
) {
  const supabase = createAdminClient();
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
 * Libera un conjunto explícito de cartones limpiando los datos de venta.
 * Cada cartón vuelve a "Asignado" si está ligado a un alumno en
 * students_cards; en caso contrario queda "Disponible".
 */
async function releaseCardNumbers(
  supabase: any,
  companyId: number,
  eventId: string,
  numbers: number[],
) {
  if (numbers.length === 0) return;

  // Cuáles de esos cartones siguen asignados a un alumno
  const { data: assigned } = await supabase
    .from("students_cards")
    .select("card_number")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .in("card_number", numbers);

  const assignedSet = new Set(
    (assigned || []).map((r: any) => r.card_number),
  );

  const releaseFields = {
    invoice_number: null,
    sales_price: null,
    sold_by: null,
    player_name: null,
    player_phone_number: null,
    player_email: null,
    updated_at: new Date().toISOString(),
  };

  const toAssigned = numbers.filter((n: number) => assignedSet.has(n));
  const toAvailable = numbers.filter((n: number) => !assignedSet.has(n));

  if (toAssigned.length > 0) {
    await supabase
      .from("cards")
      .update({ ...releaseFields, card_status: "Asignado" })
      .eq("company_id", companyId)
      .eq("event_id", eventId)
      .in("card_number", toAssigned);
  }
  if (toAvailable.length > 0) {
    const { error } = await supabase
      .from("cards")
      .update({ ...releaseFields, card_status: "Disponible" })
      .eq("company_id", companyId)
      .eq("event_id", eventId)
      .in("card_number", toAvailable);
    if (error) throw error;
  }
}

/**
 * Libera los cartones vinculados a una factura limpiando los datos de venta.
 * Envuelve releaseCardNumbers: primero resuelve los números ligados al
 * invoice_number y luego aplica la liberación por número.
 */
async function releaseInvoiceCards(
  supabase: any,
  companyId: number,
  eventId: string,
  invoiceNumber: string,
) {
  const { data: linkedCards } = await supabase
    .from("cards")
    .select("card_number")
    .eq("company_id", companyId)
    .eq("event_id", eventId)
    .eq("invoice_number", invoiceNumber);

  const numbers = (linkedCards || []).map((c: any) => Number(c.card_number));
  await releaseCardNumbers(supabase, companyId, eventId, numbers);
}

/**
 * Actualiza una factura existente y re-vincula sus cartones.
 * Misma lógica que la Server Action updateInvoice, sin el re-render RSC.
 */
export async function updateInvoiceCore(formData: FormData, userId?: string) {
  const id = formData.get("id") as string;

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

  const validation = invoiceUpdateSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error:
        "Datos inválidos: " +
        validation.error.issues.map((e) => e.message).join(", "),
    };
  }

  const data = validation.data;
  const supabase = createAdminClient();

  const { data: currentInvoice } = await supabase
    .from("invoices")
    .select("url_invoice, invoice_number, status")
    .eq("id", id)
    .single();

  // Si el número de factura cambió, verificar que no esté duplicado
  if (
    data.invoice_number &&
    data.invoice_number !== currentInvoice?.invoice_number
  ) {
    const { data: duplicate } = await supabase
      .from("invoices")
      .select("id")
      .eq("company_id", data.company_id || 0)
      .eq("event_id", data.event_id || "")
      .eq("invoice_number", data.invoice_number)
      .neq("id", id)
      .maybeSingle();

    if (duplicate) {
      return {
        error: `Ya existe una factura con el número ${data.invoice_number} en este evento.`,
      };
    }
  }

  let url_invoice = currentInvoice?.url_invoice || null;

  const invoice_file = formData.get("invoice_file") as File;
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

      // Cleanup: borrar archivo anterior del Storage si existe
      if (currentInvoice?.url_invoice) {
        try {
          const oldUrlParts =
            currentInvoice.url_invoice.split("/invoices_images/");
          if (oldUrlParts.length > 1) {
            await supabase.storage
              .from("invoices_images")
              .remove([oldUrlParts[1]]);
          }
        } catch (cleanupError) {
          console.warn("Error cleaning up old invoice:", cleanupError);
        }
      }

      url_invoice = publicUrl;
    } catch (err: any) {
      console.error("Error processing invoice file update:", err);
      return { error: `Error procesando archivo de factura: ${err.message}` };
    }
  }

  const { associated_cards, ...invoiceFields } = data;

  const invoiceData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (invoiceFields.company_id !== undefined) invoiceData.company_id = invoiceFields.company_id;
  if (invoiceFields.event_id !== undefined) invoiceData.event_id = invoiceFields.event_id;
  if (invoiceFields.invoice_number !== undefined) invoiceData.invoice_number = sanitizeInput(invoiceFields.invoice_number || "");
  if (invoiceFields.invoice_date !== undefined) invoiceData.invoice_date = invoiceFields.invoice_date;
  if (invoiceFields.customer_name !== undefined) invoiceData.customer_name = toTitleCase(sanitizeInput(invoiceFields.customer_name || ""));
  if (invoiceFields.customer_email !== undefined) invoiceData.customer_email = sanitizeInput(invoiceFields.customer_email || "");
  if (invoiceFields.phone_area !== undefined) invoiceData.phone_area = sanitizeInput(invoiceFields.phone_area || "");
  if (invoiceFields.phone_number !== undefined) invoiceData.phone_number = sanitizeInput(invoiceFields.phone_number || "");
  if (invoiceFields.whatsapp_number !== undefined) invoiceData.whatsapp_number = sanitizeInput(invoiceFields.whatsapp_number || "");
  if (invoiceFields.manager_name !== undefined) invoiceData.manager_name = toTitleCase(sanitizeInput(invoiceFields.manager_name || ""));
  const isDonada =
    (invoiceFields.status ?? currentInvoice?.status) === "Donada";
  if (invoiceFields.cards_number !== undefined) invoiceData.cards_number = invoiceFields.cards_number;
  if (invoiceFields.card_price !== undefined) invoiceData.card_price = isDonada ? 0 : invoiceFields.card_price;
  if (invoiceFields.total_amount !== undefined) invoiceData.total_amount = isDonada ? 0 : invoiceFields.total_amount;
  if (invoiceFields.payment_method !== undefined) invoiceData.payment_method = invoiceFields.payment_method;
  if (invoiceFields.status !== undefined) invoiceData.status = invoiceFields.status;
  if (invoiceFields.observation !== undefined) invoiceData.observation = sanitizeInput(invoiceFields.observation || "");
  if (url_invoice) invoiceData.url_invoice = url_invoice;

  const { error: invoiceError } = await supabase
    .from("invoices")
    .update(invoiceData)
    .eq("id", id);

  if (invoiceError) return { error: invoiceError.message };

  // Cartones actualmente ligados a la factura (con sus campos de venta
  // para restaurarlos si la nueva vinculación falla).
  let previousCards: any[] = [];
  if (currentInvoice?.invoice_number) {
    const { data: oldCards } = await supabase
      .from("cards")
      .select(
        "card_number, card_status, sales_price, sold_by, player_name, player_phone_number, player_email",
      )
      .eq("company_id", data.company_id || 0)
      .eq("event_id", data.event_id || "")
      .eq("invoice_number", currentInvoice.invoice_number);
    previousCards = oldCards || [];
  }

  const previousNumbers = new Set(
    previousCards.map((c: any) => Number(c.card_number)),
  );
  const newSelection: number[] = (data.associated_cards || []).map(Number);

  if (newSelection.length > 0) {
    // Reclamar ANTES de liberar: si el reclamo falla, los cartones
    // vinculados quedan intactos (nunca quedan huérfanos en Disponible).
    const claimFields = {
      card_status: isDonada ? "Donado" : "Vendido",
      invoice_number: data.invoice_number,
      sales_price: data.card_price,
      sold_by: invoiceData.manager_name || data.manager_name,
      player_name: invoiceData.customer_name || data.customer_name,
      player_phone_number: data.whatsapp_number,
      player_email: data.customer_email,
      updated_at: new Date().toISOString(),
    };

    const claimedNums = new Set<number>();
    let cardsError: any = null;

    // A) Cartones ya vinculados a esta factura: re-afirmar datos de venta.
    //    El guard por invoice_number detecta si otra operación los liberó.
    const alreadyLinked = newSelection.filter((n) => previousNumbers.has(n));
    if (alreadyLinked.length > 0) {
      const { data: relinked, error } = await supabase
        .from("cards")
        .update(claimFields)
        .eq("company_id", data.company_id || 0)
        .eq("event_id", data.event_id || "")
        .eq("invoice_number", currentInvoice?.invoice_number || "")
        .in("card_number", alreadyLinked)
        .select("card_number");
      (relinked || []).forEach((c: any) => claimedNums.add(Number(c.card_number)));
      cardsError = error;
    }

    // B) Cartones nuevos: solo se reclaman si están libres para la venta
    //    (whitelist del enum: Disponible/Asignado). Guard anti-carrera.
    const toClaim = newSelection.filter((n) => !previousNumbers.has(n));
    if (!cardsError && toClaim.length > 0) {
      const { data: claimed, error } = await supabase
        .from("cards")
        .update(claimFields)
        .eq("company_id", data.company_id || 0)
        .eq("event_id", data.event_id || "")
        .in("card_number", toClaim)
        .in("card_status", ["Disponible", "Asignado"])
        .select("card_number");
      (claimed || []).forEach((c: any) => claimedNums.add(Number(c.card_number)));
      cardsError = error;
    }

    if (cardsError || claimedNums.size !== newSelection.length) {
      // Revertir: liberar lo reclamado con el número (nuevo) de esta
      // factura y restaurar la vinculación previa con sus datos originales.
      await releaseInvoiceCards(
        supabase,
        data.company_id || 0,
        data.event_id || "",
        data.invoice_number || currentInvoice?.invoice_number || "",
      );
      for (const prev of previousCards) {
        await supabase
          .from("cards")
          .update({
            card_status: prev.card_status,
            invoice_number: currentInvoice?.invoice_number,
            sales_price: prev.sales_price,
            sold_by: prev.sold_by,
            player_name: prev.player_name,
            player_phone_number: prev.player_phone_number,
            player_email: prev.player_email,
          })
          .eq("company_id", data.company_id || 0)
          .eq("event_id", data.event_id || "")
          .eq("card_number", prev.card_number);
      }

      if (cardsError) {
        return { error: `Error al vincular cartones: ${cardsError.message}` };
      }
      const conflicted = newSelection.filter((n) => !claimedNums.has(n));
      return {
        error: `Los cartones ${conflicted.join(", ")} acaban de ser vendidos o anulados por otra operación. La factura conservó su vinculación anterior.`,
      };
    }
  }

  // Liberar solo los cartones que quedaron fuera de la nueva selección
  // (después de un reclamo exitoso, para no desvincular en caso de error).
  const freed = previousCards
    .map((c: any) => Number(c.card_number))
    .filter((n: number) => !newSelection.includes(n));
  await releaseCardNumbers(
    supabase,
    data.company_id || 0,
    data.event_id || "",
    freed,
  );

  await supabase.from("user_activity_log").insert({
    user_id: userId,
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

  return { success: true };
}

/**
 * Elimina una factura y libera sus cartones asociados.
 * Misma lógica que la Server Action deleteInvoice, sin el re-render RSC.
 */
export async function deleteInvoiceCore(id: string, userId?: string) {
  const supabase = createAdminClient();

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("invoice_number, event_id, company_id, url_invoice")
    .eq("id", id)
    .single();

  if (fetchError) return { error: fetchError.message };
  if (!invoice) return { error: "Factura no encontrada." };

  // Liberar cartones ANTES de borrar (idempotente: si el delete falla y
  // se reintenta, este update toca 0 filas).
  try {
    await releaseInvoiceCards(
      supabase,
      invoice.company_id,
      invoice.event_id,
      invoice.invoice_number,
    );
  } catch (cardsError: any) {
    return {
      error: `Error al liberar cartones asociados: ${cardsError.message}`,
    };
  }

  if (invoice.url_invoice) {
    try {
      const urlParts = invoice.url_invoice.split("/invoices_images/");
      if (urlParts.length > 1) {
        await supabase.storage.from("invoices_images").remove([urlParts[1]]);
      }
    } catch (cleanupError) {
      console.warn("Error cleaning up invoice image:", cleanupError);
    }
  }

  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) return { error: error.message };

  if (userId) {
    await supabase.from("user_activity_log").insert({
      user_id: userId,
      action: "DELETE",
      entity: "invoices",
      metadata: {
        invoice_id: id,
        invoice_number: invoice.invoice_number,
        event_id: invoice.event_id,
        cards_released: true,
        timestamp: new Date().toISOString(),
      },
    });
  }

  return { success: true };
}
