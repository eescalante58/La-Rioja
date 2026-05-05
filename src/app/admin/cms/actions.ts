"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Updates a section of content in the CMS.
 * @param {string} id - The ID of the content to update.
 * @param {Object} formData - The updated data.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateCMSContent(id: string, formData: any) {
  const supabase = createClient();

  const { error } = await supabase
    .from("site_content")
    .update({
      title: formData.title,
      description: formData.description,
      is_active: formData.is_active,
      content_order: parseInt(formData.content_order) || 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating CMS content:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/cms");
  return { success: true };
}
