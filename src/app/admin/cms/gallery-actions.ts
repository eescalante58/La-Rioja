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

async function bulkUploadGalleryImagesInternal(images: any[]) {
  const supabase = await createAdminClient();
  const results = [];
  const errors = [];

  for (const image of images) {
    try {
      const { data, error } = await supabase
        .from("event_gallery")
        .insert([image]);

      if (error) {
        throw error;
      }

      results.push(data[0]);
    } catch (error) {
      console.error("Error uploading image:", error);
      errors.push(error.message);
    }
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

export const bulkUploadGalleryImages = withRole(4, bulkUploadGalleryImagesInternal);
export const getGalleryImages = getGalleryImagesInternal;
export const updateGalleryImagesOrder = withRole(4, updateGalleryImagesOrderInternal);
export const deleteGalleryImage = withRole(4, deleteGalleryImageInternal);
