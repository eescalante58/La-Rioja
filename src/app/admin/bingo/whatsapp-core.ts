import { createClient } from "@/lib/supabase/server";

/**
 * Lógica de WhatsApp compartida entre las Server Actions de
 * /admin/bingo/actions.ts y el Route Handler /api/bingo/whatsapp.
 *
 * Las Server Actions re-renderizan la página RSC completa en cada
 * respuesta; el Route Handler responde solo JSON, por eso el flujo de
 * envío posterior a la venta (alta frecuencia en el evento) va por /api.
 */

/** Plantilla activa del mensaje de cartones (site_content). */
export async function getWhatsAppMessageTemplateCore() {
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

/**
 * Marca la factura con el estado del envío WhatsApp y registra la
 * actividad del usuario (SEND_WHATSAPP) para auditoría.
 */
export async function updateInvoiceWhatsAppStatusCore(
  id: string,
  status: string,
  userId?: string,
) {
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("invoice_number, event_id, customer_name")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("invoices")
    .update({
      send_whatsapp_message: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  if (userId) {
    await supabase.from("user_activity_log").insert({
      user_id: userId,
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

  return { success: true };
}

/**
 * Envía un POST a la API de Ultramsg y evalúa la respuesta.
 * La API reporta errores en el body ({"error": "..."} o {"sent": "false"})
 * incluso cuando el HTTP status es 200, por lo que hay que leerlo siempre.
 */
async function ultramsgPost(
  url: string,
  params: Record<string, string>,
): Promise<{ ok: boolean; status: number; error?: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const data = await res.json().catch(() => null);

  const error =
    data?.error ||
    (data?.sent === "false" || data?.sent === false
      ? data?.message || "Ultramsg rechazó el envío"
      : null) ||
    (!res.ok ? `Error HTTP ${res.status} de Ultramsg` : null);

  return { ok: !error, status: res.status, error: error || undefined };
}

/**
 * Consulta el estado de la instancia de Ultramsg para detectar suspensión
 * por falta de pago, desconexión u otros errores de la API antes de enviar.
 */
export async function checkWhatsAppInstanceStatusCore() {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;

  if (!instanceId || !token) {
    return { success: false, error: "Ultramsg credentials not configured." };
  }

  try {
    const res = await fetch(
      `https://api.ultramsg.com/${instanceId}/instance/status?token=${token}`,
    );
    const data = await res.json().catch(() => null);

    if (!res.ok || data?.error) {
      return {
        success: false,
        error: data?.error || `Error HTTP ${res.status} consultando la instancia.`,
      };
    }

    const accountStatus =
      data?.status?.accountStatus?.status ??
      data?.status?.accountStatus ??
      null;

    if (
      typeof accountStatus === "string" &&
      !/authenticated|normal|connected|standby/i.test(accountStatus)
    ) {
      return {
        success: false,
        error: `La instancia de Ultramsg no está activa (estado: ${accountStatus}).`,
      };
    }

    return { success: true, status: accountStatus };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Envío automático por Ultramsg: imagen de plantilla, mensaje de texto,
 * PDF de factura y PDFs de cartones — en ese orden, abortando al primer
 * error (si la instancia está caída o el número es inválido, los pasos
 * siguientes fallarían igual).
 */
export async function sendWhatsAppAutomationCore(payload: {
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

  const status = await checkWhatsAppInstanceStatusCore();
  if (!status.success) {
    return { success: false, error: status.error };
  }

  try {
    const steps: { step: string; url: string; params: Record<string, string> }[] = [];

    if (payload.templateImage) {
      steps.push({
        step: "template_image",
        url: `${baseUrl}/image`,
        params: {
          token,
          to: payload.to,
          image: payload.templateImage,
          caption: "Bingo La Rioja",
          priority: "10",
        },
      });
    }

    steps.push({
      step: "text",
      url: `${baseUrl}/chat`,
      params: {
        token,
        to: payload.to,
        body: payload.message,
        priority: "10",
      },
    });

    if (payload.invoiceUrl) {
      steps.push({
        step: "invoice_pdf",
        url: `${baseUrl}/document`,
        params: {
          token,
          to: payload.to,
          document: payload.invoiceUrl,
          filename: "Factura_Bingo.pdf",
          caption: "Factura de Compra",
          priority: "10",
        },
      });
    }

    payload.cardUrls.forEach((cardUrl, index) => {
      steps.push({
        step: `card_pdf_${index + 1}`,
        url: `${baseUrl}/document`,
        params: {
          token,
          to: payload.to,
          document: cardUrl,
          filename: `Carton_Bingo_${index + 1}.pdf`,
          caption: `Cartón de Bingo #${index + 1}`,
          priority: "10",
        },
      });
    });

    const results = [];
    for (const s of steps) {
      const r = await ultramsgPost(s.url, s.params);
      results.push({ step: s.step, status: r.status, error: r.error });
      if (!r.ok) {
        return { success: false, error: r.error, results };
      }
    }

    return { success: true, results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
