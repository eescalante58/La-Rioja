"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireRoleLevel } from "@/lib/auth/authorization";

/**
 * Sanitizes string input to prevent basic HTML injection.
 * In a real production app, consider using a library like DOMPurify for complex HTML.
 */
function sanitizeInput(str: string): string {
  if (!str) return "";
  return str
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") // Remove scripts
    .replace(/on\w+="[^"]*"/gim, "") // Remove on* attributes
    .replace(/javascript:/gim, ""); // Remove javascript: links
}

/**
 * Updates a section of content in the CMS.
 * @param {string} id - The ID of the content to update.
 * @param {FormData} formData - The updated data as FormData.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateCMSContent(id: string, formData: FormData) {
  const { user, error: authError } = await requireRoleLevel(80); // Min Admin level
  if (authError) return { success: false, error: authError };

  const supabase = await createClient();

  // Extraer y sanitizar datos
  const title = sanitizeInput(formData.get("title") as string);
  const description = sanitizeInput(formData.get("description") as string);
  const is_active = formData.get("is_active") === "true";
  const content_order = parseInt(formData.get("content_order") as string) || 0;
  const metadataStr = formData.get("metadata") as string;
  const section_key = formData.get("section_key") as string;
  const old_image_url = formData.get("old_image_url") as string;
  const file = formData.get("file") as File | null;

  let metadata = {};
  try {
    metadata = JSON.parse(metadataStr || "{}");
  } catch (e) {
    console.error("Metadata parse error:", e);
  }

  let image_url = old_image_url;

  // 1. Handle File Upload if present
  if (file && file instanceof File && file.size > 0) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${section_key || id}_${Date.now()}.${fileExt}`;
    const storagePath = `cms/${fileName}`;

    try {
      const arrayBuffer = await file.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("cms_images")
        .upload(storagePath, arrayBuffer, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(`Error al subir imagen: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("cms_images").getPublicUrl(storagePath);

      // Cleanup: Delete old file if it exists and is different from the new one
      if (
        old_image_url &&
        old_image_url !== publicUrl &&
        old_image_url.includes("/cms_images/")
      ) {
        try {
          // Extraer la ruta del objeto del URL (todo lo después de /cms_images/)
          const oldUrlParts = old_image_url.split("/cms_images/");
          if (oldUrlParts.length > 1) {
            // Limpiar posibles parámetros de búsqueda (query params)
            const oldStoragePath = oldUrlParts[1].split("?")[0];
            await supabase.storage.from("cms_images").remove([oldStoragePath]);
          }
        } catch (cleanupErr) {
          console.error("Error cleaning up old image:", cleanupErr);
          // No bloqueamos el proceso principal si falla la limpieza
        }
      }

      image_url = publicUrl;
    } catch (uploadErr: any) {
      console.error("Upload error:", uploadErr);
      return { success: false, error: uploadErr.message };
    }
  }

  const { error } = await supabase
    .from("site_content")
    .update({
      title,
      description,
      image_url,
      is_active,
      content_order,
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Database error:", error);
    return { success: false, error: error.message };
  }

  // Registro de auditoría
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "UPDATE_CMS_CONTENT",
      entity: "site_content",
      metadata: {
        id,
        section_key,
        title,
        image_updated: image_url !== old_image_url,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/cms");
  revalidatePath("/");
  return { success: true };
}

/**
 * Updates a FAQ entry.
 * @param {string} id - The ID of the FAQ to update.
 * @param {FormData} formData - The updated FAQ data.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateFAQ(id: string, formData: FormData) {
  const { user, error: authError } = await requireRoleLevel(80);
  if (authError) return { success: false, error: authError };

  const supabase = await createClient();

  const question = sanitizeInput(formData.get("question") as string);
  const answer = sanitizeInput(formData.get("answer") as string);
  const section_id = formData.get("section_id") as string | null;
  const is_active = formData.get("is_active") === "true";
  const content_order = parseInt(formData.get("content_order") as string) || 0;

  const { error } = await supabase
    .from("faqs")
    .update({
      question,
      answer,
      section_id: section_id || null,
      is_active,
      content_order,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Database error (FAQ update):", error);
    return { success: false, error: error.message };
  }

  // Registro de auditoría
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "UPDATE_FAQ",
      entity: "faqs",
      metadata: {
        id,
        question: question.substring(0, 100),
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/cms");
  revalidatePath("/");
  return { success: true };
}

/**
 * Creates a new FAQ entry.
 * @param {FormData} formData - The FAQ data.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function createFAQ(formData: FormData) {
  const { user, error: authError } = await requireRoleLevel(80);
  if (authError) return { success: false, error: authError };

  const supabase = await createClient();

  const question = sanitizeInput(formData.get("question") as string);
  const answer = sanitizeInput(formData.get("answer") as string);
  const section_id = formData.get("section_id") as string | null;
  const is_active = formData.get("is_active") === "true";
  const content_order = parseInt(formData.get("content_order") as string) || 0;

  const { data, error } = await supabase
    .from("faqs")
    .insert([
      {
        question,
        answer,
        section_id: section_id || null,
        is_active,
        content_order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Database error (FAQ creation):", error);
    return { success: false, error: error.message };
  }

  // Registro de auditoría
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "CREATE_FAQ",
      entity: "faqs",
      metadata: {
        id: data.id,
        question: question.substring(0, 100),
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/cms");
  revalidatePath("/");
  return { success: true };
}

/**
 * Deletes a FAQ entry.
 * @param {string} id - The ID of the FAQ to delete.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFAQ(id: string) {
  const { error: authError } = await requireRoleLevel(80);
  if (authError) return { success: false, error: authError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("faqs").delete().eq("id", id);

  if (error) {
    console.error("Error deleting FAQ:", error);
    return { success: false, error: error.message };
  }

  // Registro de auditoría
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "DELETE_FAQ",
      entity: "faqs",
      metadata: {
        id,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/cms");
  revalidatePath("/");
  return { success: true };
}

/**
 * Updates a FAQ section.
 * @param {string} id - The ID of the section to update.
 * @param {FormData} formData - The updated section data.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateFAQSection(id: string, formData: FormData) {
  const { user, error: authError } = await requireRoleLevel(80);
  if (authError) return { success: false, error: authError };

  const supabase = await createClient();

  const title = sanitizeInput(formData.get("title") as string);
  const description = sanitizeInput(formData.get("description") as string);
  const is_active = formData.get("is_active") === "true";
  const content_order = parseInt(formData.get("content_order") as string) || 0;

  const { error } = await supabase
    .from("faq_sections")
    .update({
      title,
      description,
      is_active,
      content_order,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Database error (FAQ section update):", error);
    return { success: false, error: error.message };
  }

  // Registro de auditoría
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "UPDATE_FAQ_SECTION",
      entity: "faq_sections",
      metadata: {
        id,
        title,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/cms");
  revalidatePath("/");
  return { success: true };
}

/**
 * Creates a new FAQ section.
 * @param {FormData} formData - The section data.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function createFAQSection(formData: FormData) {
  const { user, error: authError } = await requireRoleLevel(80);
  if (authError) return { success: false, error: authError };

  const supabase = await createClient();

  const title = sanitizeInput(formData.get("title") as string);
  const description = sanitizeInput(formData.get("description") as string);
  const is_active = formData.get("is_active") === "true";
  const content_order = parseInt(formData.get("content_order") as string) || 0;

  const { data, error } = await supabase
    .from("faq_sections")
    .insert([
      {
        title,
        description,
        is_active,
        content_order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Database error (FAQ section creation):", error);
    return { success: false, error: error.message };
  }

  // Registro de auditoría
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "CREATE_FAQ_SECTION",
      entity: "faq_sections",
      metadata: {
        id: data.id,
        title,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/cms");
  revalidatePath("/");
  return { success: true };
}

/**
 * Deletes a FAQ section.
 * @param {string} id - The ID of the section to delete.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFAQSection(id: string) {
  const { error: authError } = await requireRoleLevel(80);
  if (authError) return { success: false, error: authError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("faq_sections").delete().eq("id", id);

  if (error) {
    console.error("Error deleting FAQ section:", error);
    return { success: false, error: error.message };
  }

  // Registro de auditoría
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "DELETE_FAQ_SECTION",
      entity: "faq_sections",
      metadata: {
        id,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/cms");
  revalidatePath("/");
  return { success: true };
}

/**
 * Creates a new section of content in the CMS.
 * @param {FormData} formData - The new section data as FormData.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function createCMSContent(formData: FormData) {
  const { user, error: authError } = await requireRoleLevel(80);
  if (authError) return { success: false, error: authError };

  const supabase = await createClient();

  const page = formData.get("page") as string;
  const section_key = formData.get("section_key") as string;
  const title = sanitizeInput(formData.get("title") as string);
  const description = sanitizeInput(formData.get("description") as string);
  const is_active = formData.get("is_active") === "true";
  const content_order = parseInt(formData.get("content_order") as string) || 0;
  const metadataStr = formData.get("metadata") as string;
  const file = formData.get("file") as File | null;

  // Check uniqueness of combination (page, section_key, content_order)
  const { data: existing } = await supabase
    .from("site_content")
    .select("id")
    .eq("page", page)
    .eq("section_key", section_key)
    .eq("content_order", content_order)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: `Ya existe un registro con la misma clave "${section_key}" y orden "${content_order}" en la página "${page}".`,
    };
  }

  let metadata = {};
  try {
    metadata = JSON.parse(metadataStr || "{}");
  } catch (e) {
    console.error("Metadata parse error:", e);
  }

  let image_url = "";

  // 1. Handle File Upload if present
  if (file && file instanceof File && file.size > 0) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${section_key}_${Date.now()}.${fileExt}`;
    const storagePath = `cms/${fileName}`;

    try {
      const arrayBuffer = await file.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("cms_images")
        .upload(storagePath, arrayBuffer, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(`Error al subir imagen: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("cms_images").getPublicUrl(storagePath);
      image_url = publicUrl;
    } catch (uploadErr: any) {
      console.error("Upload error:", uploadErr);
      return { success: false, error: uploadErr.message };
    }
  }

  const { data, error } = await supabase
    .from("site_content")
    .insert([
      {
        page,
        section_key,
        title,
        description,
        image_url,
        is_active,
        content_order,
        metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Database error:", error);
    return { success: false, error: error.message };
  }

  // Registro de auditoría
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "CREATE_CMS_CONTENT",
      entity: "site_content",
      metadata: {
        id: data.id,
        section_key,
        title,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/cms");
  revalidatePath("/");
  return { success: true };
}

/**
 * Deletes a section of content in the CMS.
 * @param {string} id - The ID of the content to delete.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteCMSContent(id: string) {
  const { error: authError } = await requireRoleLevel(100); // Only Super Admin can delete sections
  if (authError) return { success: false, error: authError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Obtener la información del registro antes de borrarlo para limpiar el storage
  const { data: item } = await supabase
    .from("site_content")
    .select("image_url")
    .eq("id", id)
    .single();

  if (item?.image_url && item.image_url.includes("/cms_images/")) {
    try {
      const oldUrlParts = item.image_url.split("/cms_images/");
      if (oldUrlParts.length > 1) {
        const oldStoragePath = oldUrlParts[1].split("?")[0];
        await supabase.storage.from("cms_images").remove([oldStoragePath]);
      }
    } catch (err) {
      console.error(
        "Error deleting image from storage during record deletion:",
        err,
      );
    }
  }

  const { error } = await supabase.from("site_content").delete().eq("id", id);

  if (error) {
    console.error("Error deleting CMS content:", error);
    return { success: false, error: error.message };
  }

  // Registro de auditoría
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "DELETE_CMS_CONTENT",
      entity: "site_content",
      metadata: {
        id,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/cms");
  return { success: true };
}
