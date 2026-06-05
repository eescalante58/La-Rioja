"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { escapeHTML } from "@/lib/utils";

import { contactSchema, type ContactInput } from "@/lib/validation/contact";

/**
 * Server Action to handle contact form submission.
 * Saves to Supabase and sends email via Resend.
 */
export async function submitContactForm(rawInput: ContactInput) {
  try {
    // 0. Validation with Zod
    const validation = contactSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: "Datos inválidos: " + validation.error.issues.map(e => e.message).join(", "),
      };
    }
    const data = validation.data;

    const apiKey = process.env.RESEND_API_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!apiKey) {
      console.error("RESEND_API_KEY no encontrada en variables de entorno.");
      return {
        success: false,
        error:
          "Configuración incompleta en el servidor. Intente más tarde.",
      };
    }

    const resend = new Resend(apiKey);

    // 0. Security Validations (P0.6 Allowlist)
    const EMAIL_ALLOWLIST: Record<string, string> = {
      general: "info@larioja.edu.gt",
      donaciones: "donaciones@larioja.edu.gt",
      programas: "programas@larioja.edu.gt",
      soporte: "soporte@larioja.edu.gt",
    };

    const targetEmail =
      EMAIL_ALLOWLIST[data.targetEmail] || EMAIL_ALLOWLIST.general;

    const sanitizedData = {
      name: escapeHTML(data.name),
      email: escapeHTML(data.email),
      phone: data.phone ? escapeHTML(data.phone) : "No proporcionado",
      type: escapeHTML(data.type),
      message: escapeHTML(data.message),
    };

    const supabase = await createClient(serviceRoleKey);

    // 1. Save to Supabase (Ecosystem Option B)
    const { error: dbError } = await supabase
      .from("contact_submissions")
      .insert([
        {
          name: data.name, // Original values for DB
          email: data.email,
          phone: data.phone,
          type: data.type,
          message: data.message,
          target_email: targetEmail,
        },
      ]);

    if (dbError) {
      console.error("Supabase Database Error:", dbError);
      return {
        success: false,
        error: `No se pudo guardar el mensaje en la base de datos: ${dbError.message} (${dbError.code})`,
      };
    }

    // 2. Send Email via Resend
    const { error: mailError } = await resend.emails.send({
      from: "La Rioja Contacto <onboarding@resend.dev>", // Replace with your verified domain
      to: [targetEmail],
      subject: `Nueva Consulta: ${sanitizedData.type} - ${sanitizedData.name}`,
      replyTo: sanitizedData.email,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #012060;">Nuevo mensaje de contacto</h2>
          <p>Has recibido una nueva consulta desde el formulario de la landing page.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Nombre:</strong> ${sanitizedData.name}</p>
          <p><strong>Email:</strong> ${sanitizedData.email}</p>
          <p><strong>Teléfono:</strong> ${sanitizedData.phone}</p>
          <p><strong>Tipo de Consulta:</strong> ${sanitizedData.type}</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 10px;">
            <p><strong>Mensaje:</strong></p>
            <p>${sanitizedData.message.replace(/\n/g, "<br>")}</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">Este es un mensaje automático enviado desde el sitio web de La Rioja.</p>
        </div>
      `,
    });

    if (mailError) {
      console.error("Mail Error:", mailError);
      return {
        success: false,
        error: "Error al enviar el correo electrónico.",
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Submission Error Details:", {
      message: error.message,
      stack: error.stack,
      data: rawInput,
    });
    return {
      success: false,
      error: `Error al procesar el envío: ${error.message || "Ocurrió un error inesperado."}`,
    };
  }
}
