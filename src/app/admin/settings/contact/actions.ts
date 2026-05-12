"use server";

import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Fetch contact submissions with search filtering
 */
export async function getContactSubmissions(searchQuery?: string) {
  const supabase = createClient();
  
  let query = supabase
    .from("contact_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (searchQuery) {
    query = query.or(`email.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,message.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching contact submissions:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Delete a contact submission
 */
export async function deleteContactSubmission(id: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("contact_submissions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting contact submission:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/settings/contact");
  return { success: true };
}

/**
 * Resend a contact submission email
 */
export async function resendContactEmail(id: string) {
  const supabase = createClient();
  
  const { data, error: fetchError } = await supabase
    .from("contact_submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !data) {
    return { success: false, error: "No se encontró el registro." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY no configurada." };
  }

  try {
    const { error: mailError } = await resend.emails.send({
      from: "La Rioja Contacto <onboarding@resend.dev>",
      to: [data.target_email],
      subject: `[REENVÍO] Nueva Consulta: ${data.type} - ${data.name}`,
      replyTo: data.email,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #012060;">Reenvío de mensaje de contacto</h2>
          <p>Este es un reenvío del mensaje original recibido el ${new Date(data.created_at).toLocaleString()}.</p>
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
      return { success: false, error: mailError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
