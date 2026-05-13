"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

interface ContactData {
  name: string;
  email: string;
  phone?: string;
  type: string;
  message: string;
  targetEmail: string;
}

/**
 * Server Action to handle contact form submission.
 * Saves to Supabase and sends email via Resend.
 */
export async function submitContactForm(data: ContactData) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    // Vercel y Supabase suelen usar SUPABASE_SERVICE_ROLE_KEY sin el prefijo NEXT_PUBLIC en el servidor
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    if (!apiKey) {
      console.error("DEBUG: RESEND_API_KEY no encontrada en process.env");
      return {
        success: false,
        error:
          "Configuración incompleta: La clave RESEND_API_KEY no está configurada en el servidor.",
      };
    }

    const resend = new Resend(apiKey);

    // Si hay serviceRoleKey, la usamos para bypass de RLS
    if (serviceRoleKey) {
      console.log("DEBUG: Usando Service Role Key para guardar el mensaje.");
    } else {
      console.warn(
        "DEBUG: No se encontró Service Role Key. Se usará la clave pública (sujeta a RLS).",
      );
    }

    const supabase = createClient(serviceRoleKey);

    // 1. Save to Supabase (Ecosystem Option B)
    const { error: dbError } = await supabase
      .from("contact_submissions")
      .insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone,
          type: data.type,
          message: data.message,
          target_email: data.targetEmail,
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
      to: [data.targetEmail],
      subject: `Nueva Consulta: ${data.type} - ${data.name}`,
      replyTo: data.email,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #012060;">Nuevo mensaje de contacto</h2>
          <p>Has recibido una nueva consulta desde el formulario de la landing page.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Nombre:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Teléfono:</strong> ${data.phone || "No proporcionado"}</p>
          <p><strong>Tipo de Consulta:</strong> ${data.type}</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 10px;">
            <p><strong>Mensaje:</strong></p>
            <p>${data.message.replace(/\n/g, "<br>")}</p>
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
      data: data,
    });
    return {
      success: false,
      error: `Error al procesar el envío: ${error.message || "Ocurrió un error inesperado."}`,
    };
  }
}
