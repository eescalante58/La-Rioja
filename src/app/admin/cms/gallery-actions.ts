"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { withRole } from "@/lib/auth/guards";

/**
 * Obtiene las imágenes de la galería para un evento.
 */
async function getGalleryImagesInternal(eventId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("event_gallery")
    .select("*")
    .eq("is_active", true)
    .order("event_id", { ascending: false })
    .order("content_order", { ascending: true });

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching gallery images:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Sube múltiples imágenes a la galería.
 */
async function bulkUploadGalleryImagesInternal(
  formData: FormData,
  context: { user: any }
) {
  const { user } = context;
  const companyId = parseInt(formData.get("company_id") as string);
  const eventId = formData.get("event_id") as string;
  const files = formData.getAll("files") as File[];
  
  if (isNaN(companyId) || !eventId || files.length === 0) {
    return { success: false, error: "Company ID, Event ID y archivos son requeridos." };
  }

  const supabase = createAdminClient();
  const results: any[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;

    const fileExt = file.name.split(".").pop();
    const fileName = `${companyId}_${eventId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const storagePath = `gallery/${companyId}/${eventId}/${fileName}`;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from("event_gallery_images")
        .upload(storagePath, arrayBuffer, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("event_gallery_images")
        .getPublicUrl(storagePath);

      const { data: inserted, error: dbError } = await supabase
        .from("event_gallery")
        .insert([
          {
            company_id: companyId,
            event_id: eventId,
            image_url: publicUrl,
            thumbnail_url: publicUrl,
            content_order: 0,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (dbError) {
        console.error("Database error details:", dbError);
        throw new Error(`Error en BD: ${dbError.message} - ${dbError.details || ''}`);
      }
      
      if (inserted) {
        results.push(inserted);
      }
    } catch (err: any) {
      console.error(`Error uploading file ${file.name}:`, err);
      errors.push(`${file.name}: ${err.message}`);
    }
  }

  if (errors.length > 0 && results.length === 0) {
    return { success: false, error: errors.join(" | ") };
  }

  if (user && results.length > 0) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "BULK_UPLOAD_GALLERY",
      entity: "event_gallery",
      metadata: {
        event_id: eventId,
        count: results.length,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/cms");
  revalidatePath("/bingo");
  
  return { 
    success: results.length > 0, 
    count: results.length,
    data: results,
    errors: errors.length > 0 ? errors : undefined 
  };
}

/**
 * Elimina una imagen de la galería.
 */
async function deleteGalleryImageInternal(id: string, context: { user: any }) {
  const { user } = context;
  const supabase = createAdminClient();

  // 1. Obtener la URL de la imagen antes de borrar el registro
  const { data: item, error: fetchError } = await supabase
    .from("event_gallery")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchError || !item) {
    return { success: false, error: "No se encontró la imagen en la base de datos." };
  }

  // 2. Intentar borrar del Storage
  if (item.image_url) {
    try {
      // Extraer el path relativo al bucket
      // La URL suele ser: .../public/event_gallery_images/path/to/file.ext
      const bucketName = "event_gallery_images";
      const parts = item.image_url.split(`/${bucketName}/`);
      
      if (parts.length > 1) {
        // El path es todo lo que viene después del nombre del bucket
        const storagePath = parts[1].split("?")[0]; // Quitar query params si existen
        
        console.log(`Intentando borrar de storage: ${storagePath} en bucket ${bucketName}`);
        
        const { data: removeData, error: removeError } = await supabase.storage
          .from(bucketName)
          .remove([storagePath]);

        if (removeError) {
          console.error("Error al borrar del bucket:", removeError);
        } else {
          console.log("Borrado de storage exitoso:", removeData);
        }
      } else {
        console.warn("No se pudo extraer el path del storage de la URL:", item.image_url);
      }
    } catch (err) {
      console.error("Error inesperado al intentar borrar del storage:", err);
    }
  }

  // 3. Borrar el registro de la base de datos
  const { error: dbError } = await supabase.from("event_gallery").delete().eq("id", id);

  if (dbError) {
    console.error("Error al borrar registro de base de datos:", dbError);
    return { success: false, error: dbError.message };
  }

  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "DELETE_GALLERY_IMAGE",
      entity: "event_gallery",
      metadata: { id, timestamp: new Date().toISOString() },
    });
  }

  revalidatePath("/admin/cms");
  revalidatePath("/bingo");
  return { success: true };
}

/**
 * Actualiza el orden de las imágenes en la galería.
 */
async function updateGalleryImagesOrderInternal(
  updates: { id: string; content_order: number }[],
  context: { user: any }
) {
  const { user } = context;
  const supabase = createAdminClient();

  // Actualización en lote usando una promesa para cada item
  const results = await Promise.all(
    updates.map(item => 
      supabase
        .from("event_gallery")
        .update({ content_order: item.content_order })
        .eq("id", item.id)
    )
  );

  const error = results.find(r => r.error);
  if (error) return { success: false, error: error.error?.message };

  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "REORDER_GALLERY",
      entity: "event_gallery",
      metadata: { count: updates.length, timestamp: new Date().toISOString() },
    });
  }

  revalidatePath("/admin/cms");
  revalidatePath("/bingo");
  return { success: true };
}

export const bulkUploadGalleryImages = withRole(4, bulkUploadGalleryImagesInternal);
export const getGalleryImages = getGalleryImagesInternal;
export const updateGalleryImagesOrder = withRole(4, updateGalleryImagesOrderInternal);
export const deleteGalleryImage = withRole(4, deleteGalleryImageInternal);
