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

export const getGalleryImages = getGalleryImagesInternal;

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
  const results = [];
  const errors = [];

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

      if (dbError) throw dbError;
      results.push(inserted);
    } catch (err: any) {
      console.error(`Error uploading file ${file.name}:`, err);
      errors.push(`${file.name}: ${err.message}`);
    }
  }

  if (user) {
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
    errors: errors.length > 0 ? errors : undefined 
  };
}

export const bulkUploadGalleryImages = withRole(8, bulkUploadGalleryImagesInternal);

/**
 * Elimina una imagen de la galería.
 */
async function deleteGalleryImageInternal(id: string, context: { user: any }) {
  const { user } = context;
  const supabase = createAdminClient();

  // 1. Obtener URL para borrar del storage
  const { data: item } = await supabase
    .from("event_gallery")
    .select("image_url")
    .eq("id", id)
    .single();

  if (item?.image_url) {
    try {
      const parts = item.image_url.split("/event_gallery_images/");
      if (parts.length > 1) {
        const path = parts[1].split("?")[0];
        await supabase.storage.from("event_gallery_images").remove([path]);
      }
    } catch (err) {
      console.error("Error deleting image from storage:", err);
    }
  }

  const { error } = await supabase.from("event_gallery").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

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

export const deleteGalleryImage = withRole(8, deleteGalleryImageInternal);
