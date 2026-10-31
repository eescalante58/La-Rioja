"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { withRole, type RoleContext } from "@/lib/auth/guards";
import { formatFriendlyError, getErrorMessage } from "@/lib/utils";
import {
  SITE_GALLERY_BUCKET,
  SITE_GALLERY_MAX_ITEMS,
  SITE_GALLERY_IMAGE_MAX_BYTES,
  SITE_GALLERY_VIDEO_MAX_BYTES,
  SITE_GALLERY_ALLOWED_IMAGE_TYPES,
  SITE_GALLERY_ALLOWED_VIDEO_TYPES,
  siteGalleryKeySchema,
  siteGalleryPrepareSchema,
  siteGalleryConfirmSchema,
  siteGalleryYouTubeSchema,
  siteGalleryItemUpdateSchema,
  siteGalleryReorderSchema,
  type SiteGalleryPrepareInput,
  type SiteGalleryConfirmInput,
  type SiteGalleryItemUpdateInput,
} from "@/lib/validation/site-gallery";
import {
  storagePrefix,
  cleanAltFromFileName,
  removeStorageObjects,
} from "@/lib/site-gallery/site-gallery-core";
import { extractYouTubeId, youTubePoster } from "@/lib/video-url";
import type { Database } from "@/types/database";

type SiteGalleryMediaRow = Database["public"]["Tables"]["site_gallery_media"]["Row"];

function revalidateGalleryPaths() {
  revalidatePath("/about");
  revalidatePath("/admin/cms");
}

/**
 * Lista todos los elementos (fotos, videos y YouTube) de una galería del sitio,
 * ordenados por content_order ascendente. Incluye los inactivos para gestión CMS.
 */
async function listSiteGalleryItemsInternal(
  page: string,
  galleryKey: string,
): Promise<{ success: boolean; data?: SiteGalleryMediaRow[]; error?: string }> {
  const keyCheck = siteGalleryKeySchema.safeParse({ page, galleryKey });
  if (!keyCheck.success) {
    return { success: false, error: keyCheck.error.issues[0]?.message };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_gallery_media")
    .select("*")
    .eq("page", keyCheck.data.page)
    .eq("gallery_key", keyCheck.data.galleryKey)
    .order("content_order", { ascending: true });

  if (error) {
    console.error("[listSiteGalleryItems] Error fetching:", error);
    return { success: false, error: formatFriendlyError(error) };
  }

  return { success: true, data: data || [] };
}

/**
 * Prepara la subida directa a Storage: genera una URL de subida firmada
 * para el archivo principal y, si es un video, una URL firmada adicional
 * para su portada WebP extraída en el navegador.
 */
async function prepareSiteGalleryUploadInternal(
  page: string,
  galleryKey: string,
  rawInput: SiteGalleryPrepareInput,
  context: RoleContext,
): Promise<{
  success: boolean;
  data?: {
    path: string;
    token: string;
    posterPath?: string;
    posterToken?: string;
  };
  error?: string;
}> {
  const keyCheck = siteGalleryKeySchema.safeParse({ page, galleryKey });
  if (!keyCheck.success) {
    return { success: false, error: keyCheck.error.issues[0]?.message };
  }
  const inputCheck = siteGalleryPrepareSchema.safeParse(rawInput);
  if (!inputCheck.success) {
    return { success: false, error: inputCheck.error.issues[0]?.message };
  }
  const { kind, contentType, size, posterContentType } = inputCheck.data;

  // 1. Validar tipo MIME y tamaño permitido
  if (kind === "image") {
    if (!SITE_GALLERY_ALLOWED_IMAGE_TYPES.includes(contentType as (typeof SITE_GALLERY_ALLOWED_IMAGE_TYPES)[number])) {
      return { success: false, error: "Formato de imagen no permitido. Solo se aceptan WebP, JPEG o PNG." };
    }
    if (size > SITE_GALLERY_IMAGE_MAX_BYTES) {
      return { success: false, error: "La imagen excede el límite permitido de 4 MB." };
    }
  } else {
    if (!SITE_GALLERY_ALLOWED_VIDEO_TYPES.includes(contentType as (typeof SITE_GALLERY_ALLOWED_VIDEO_TYPES)[number])) {
      return { success: false, error: "Formato de video no permitido. Solo se aceptan MP4 o WebM." };
    }
    if (size > SITE_GALLERY_VIDEO_MAX_BYTES) {
      return { success: false, error: "El video excede el límite máximo permitido de 50 MB." };
    }
    if (posterContentType !== "image/webp") {
      return { success: false, error: "La portada del video debe proporcionarse en formato WebP." };
    }
  }

  // 2. Verificar que no se sobrepase el límite total de elementos
  const supabase = createAdminClient();
  const { count, error: countErr } = await supabase
    .from("site_gallery_media")
    .select("id", { count: "exact", head: true })
    .eq("page", keyCheck.data.page)
    .eq("gallery_key", keyCheck.data.galleryKey);

  if (countErr) {
    return { success: false, error: formatFriendlyError(countErr) };
  }
  if ((count || 0) >= SITE_GALLERY_MAX_ITEMS) {
    return {
      success: false,
      error: `La galería ha alcanzado el límite máximo de ${SITE_GALLERY_MAX_ITEMS} elementos. Elimine alguno antes de subir nuevos.`,
    };
  }

  // 3. Generar rutas y URLs firmadas
  const prefix = storagePrefix(keyCheck.data.page, keyCheck.data.galleryKey);
  const fileExt = contentType === "image/webp" ? "webp" : contentType.split("/")[1] || "bin";
  const uniqueId = crypto.randomUUID();
  const filePath = `${prefix}${uniqueId}.${fileExt}`;

  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from(SITE_GALLERY_BUCKET)
    .createSignedUploadUrl(filePath);

  if (uploadErr || !uploadData) {
    return { success: false, error: `No se pudo preparar la subida: ${uploadErr?.message || "Error desconocido"}` };
  }

  let posterPath: string | undefined;
  let posterToken: string | undefined;

  if (kind === "video") {
    posterPath = `${prefix}${uniqueId}-poster.webp`;
    const { data: posterData, error: posterErr } = await supabase.storage
      .from(SITE_GALLERY_BUCKET)
      .createSignedUploadUrl(posterPath);

    if (posterErr || !posterData) {
      // Revertir signed URL creada
      return { success: false, error: `No se pudo preparar la subida de la portada: ${posterErr?.message}` };
    }
    posterToken = posterData.token;
  }

  return {
    success: true,
    data: {
      path: uploadData.path,
      token: uploadData.token,
      posterPath,
      posterToken,
    },
  };
}

/**
 * Confirma el archivo subido: verifica su existencia en el bucket, obtiene sus
 * URLs públicas e inserta el nuevo registro al final del orden actual.
 */
async function confirmSiteGalleryUploadInternal(
  page: string,
  galleryKey: string,
  rawInput: SiteGalleryConfirmInput,
  context: RoleContext,
): Promise<{ success: boolean; data?: SiteGalleryMediaRow; error?: string }> {
  const { user } = context;
  const keyCheck = siteGalleryKeySchema.safeParse({ page, galleryKey });
  if (!keyCheck.success) {
    return { success: false, error: keyCheck.error.issues[0]?.message };
  }
  const inputCheck = siteGalleryConfirmSchema.safeParse(rawInput);
  if (!inputCheck.success) {
    return { success: false, error: inputCheck.error.issues[0]?.message };
  }
  const { kind, path, posterPath, durationSeconds, fileName } = inputCheck.data;
  const prefix = storagePrefix(keyCheck.data.page, keyCheck.data.galleryKey);

  // Validación de seguridad de la ruta
  if (!path.startsWith(prefix)) {
    return { success: false, error: "Ruta de archivo no autorizada para esta galería." };
  }
  if (kind === "video" && (!posterPath || !posterPath.startsWith(prefix))) {
    return { success: false, error: "Ruta de portada no autorizada para este video." };
  }

  const supabase = createAdminClient();
  const storage = supabase.storage.from(SITE_GALLERY_BUCKET);

  // Verificar que el archivo realmente exista en el bucket
  const { data: info, error: infoErr } = await storage.info(path);
  if (infoErr || !info) {
    return { success: false, error: "No se encontró el archivo subido en el almacenamiento. Intente nuevamente." };
  }

  let posterUrl: string | null = null;
  if (kind === "video" && posterPath) {
    const { data: posterInfo, error: posterInfoErr } = await storage.info(posterPath);
    if (posterInfoErr || !posterInfo) {
      await removeStorageObjects([path, posterPath]);
      return { success: false, error: "No se encontró la portada generada en el almacenamiento." };
    }
    posterUrl = storage.getPublicUrl(posterPath).data.publicUrl;
  }

  const mediaUrl = storage.getPublicUrl(path).data.publicUrl;
  const altText = cleanAltFromFileName(fileName);

  // Obtener el orden máximo actual
  const { data: maxRow } = await supabase
    .from("site_gallery_media")
    .select("content_order")
    .eq("page", keyCheck.data.page)
    .eq("gallery_key", keyCheck.data.galleryKey)
    .order("content_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxRow?.content_order || 0) + 1;

  // Insertar en BD
  const { data: inserted, error: insertErr } = await supabase
    .from("site_gallery_media")
    .insert({
      page: keyCheck.data.page,
      gallery_key: keyCheck.data.galleryKey,
      media_type: kind,
      media_url: mediaUrl,
      storage_path: path,
      poster_url: posterUrl,
      poster_storage_path: posterPath || null,
      youtube_id: null,
      duration_seconds: kind === "video" ? durationSeconds || null : null,
      alt_text: altText,
      caption: null,
      content_order: nextOrder,
      is_active: true,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (insertErr || !inserted) {
    console.error("[confirmSiteGalleryUpload] Error inserting:", insertErr);
    // Borrado preventivo del archivo huérfano
    await removeStorageObjects([path, posterPath]);
    return { success: false, error: formatFriendlyError(insertErr) };
  }

  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "UPLOAD_SITE_GALLERY_ITEM",
      entity: "site_gallery_media",
      metadata: {
        id: inserted.id,
        media_type: kind,
        page: keyCheck.data.page,
        gallery_key: keyCheck.data.galleryKey,
        content_order: nextOrder,
      },
    });
  }

  revalidateGalleryPaths();
  return { success: true, data: inserted };
}

/**
 * Descarta archivos subidos si la subida fue cancelada por el usuario o falló el proceso.
 */
async function discardSiteGalleryUploadInternal(
  page: string,
  galleryKey: string,
  paths: string[],
  context: RoleContext,
): Promise<{ success: boolean; error?: string }> {
  const keyCheck = siteGalleryKeySchema.safeParse({ page, galleryKey });
  if (!keyCheck.success) {
    return { success: false, error: keyCheck.error.issues[0]?.message };
  }
  const prefix = storagePrefix(keyCheck.data.page, keyCheck.data.galleryKey);
  const safePaths = paths.filter((p) => typeof p === "string" && p.startsWith(prefix));
  await removeStorageObjects(safePaths);
  return { success: true };
}

/**
 * Registra un video de YouTube en la galería mediante su enlace.
 */
async function addSiteGalleryYouTubeInternal(
  page: string,
  galleryKey: string,
  url: string,
  context: RoleContext,
): Promise<{ success: boolean; data?: SiteGalleryMediaRow; error?: string }> {
  const { user } = context;
  const keyCheck = siteGalleryKeySchema.safeParse({ page, galleryKey });
  if (!keyCheck.success) {
    return { success: false, error: keyCheck.error.issues[0]?.message };
  }
  const urlCheck = siteGalleryYouTubeSchema.safeParse({ url });
  if (!urlCheck.success) {
    return { success: false, error: urlCheck.error.issues[0]?.message };
  }

  const ytId = extractYouTubeId(urlCheck.data.url);
  if (!ytId) {
    return { success: false, error: "Identificador de YouTube no reconocido." };
  }

  const supabase = createAdminClient();

  // Verificar duplicados en la misma galería
  const { data: existing } = await supabase
    .from("site_gallery_media")
    .select("id")
    .eq("page", keyCheck.data.page)
    .eq("gallery_key", keyCheck.data.galleryKey)
    .eq("youtube_id", ytId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Este video de YouTube ya se encuentra en la galería." };
  }

  // Verificar límite total
  const { count } = await supabase
    .from("site_gallery_media")
    .select("id", { count: "exact", head: true })
    .eq("page", keyCheck.data.page)
    .eq("gallery_key", keyCheck.data.galleryKey);

  if ((count || 0) >= SITE_GALLERY_MAX_ITEMS) {
    return {
      success: false,
      error: `La galería ha alcanzado el límite máximo de ${SITE_GALLERY_MAX_ITEMS} elementos.`,
    };
  }

  // Intentar obtener el título de YouTube mediante oEmbed
  let resolvedTitle = "Video de YouTube de La Rioja";
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.title === "string" && data.title.trim().length >= 5) {
        resolvedTitle = data.title.trim().slice(0, 150);
      }
    }
  } catch {
    // Si falla oEmbed, se usa el fallback seguro
  }

  const { data: maxRow } = await supabase
    .from("site_gallery_media")
    .select("content_order")
    .eq("page", keyCheck.data.page)
    .eq("gallery_key", keyCheck.data.galleryKey)
    .order("content_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxRow?.content_order || 0) + 1;

  const { data: inserted, error: insertErr } = await supabase
    .from("site_gallery_media")
    .insert({
      page: keyCheck.data.page,
      gallery_key: keyCheck.data.galleryKey,
      media_type: "youtube",
      media_url: `https://youtu.be/${ytId}`,
      storage_path: null,
      poster_url: youTubePoster(ytId),
      poster_storage_path: null,
      youtube_id: ytId,
      duration_seconds: null,
      alt_text: resolvedTitle,
      caption: null,
      content_order: nextOrder,
      is_active: true,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (insertErr || !inserted) {
    console.error("[addSiteGalleryYouTube] Insert error:", insertErr);
    return { success: false, error: formatFriendlyError(insertErr) };
  }

  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "ADD_SITE_GALLERY_YOUTUBE",
      entity: "site_gallery_media",
      metadata: {
        id: inserted.id,
        youtube_id: ytId,
        page: keyCheck.data.page,
        gallery_key: keyCheck.data.galleryKey,
      },
    });
  }

  revalidateGalleryPaths();
  return { success: true, data: inserted };
}

/**
 * Actualiza el texto alternativo, la leyenda o la visibilidad de un elemento.
 */
async function updateSiteGalleryItemInternal(
  id: string,
  patch: SiteGalleryItemUpdateInput,
  context: RoleContext,
): Promise<{ success: boolean; data?: SiteGalleryMediaRow; error?: string }> {
  const { user } = context;
  const updateCheck = siteGalleryItemUpdateSchema.safeParse(patch);
  if (!updateCheck.success) {
    return { success: false, error: updateCheck.error.issues[0]?.message };
  }

  const supabase = createAdminClient();
  const { data: updated, error } = await supabase
    .from("site_gallery_media")
    .update({
      ...updateCheck.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    console.error("[updateSiteGalleryItem] Update error:", error);
    return { success: false, error: formatFriendlyError(error) };
  }

  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "UPDATE_SITE_GALLERY_ITEM",
      entity: "site_gallery_media",
      metadata: { id, patch: updateCheck.data },
    });
  }

  revalidateGalleryPaths();
  return { success: true, data: updated };
}

/**
 * Reordena atómicamente todos los elementos de la galería mediante el RPC reorder_site_gallery.
 */
async function reorderSiteGalleryItemsInternal(
  page: string,
  galleryKey: string,
  ids: string[],
  context: RoleContext,
): Promise<{ success: boolean; error?: string }> {
  const { user } = context;
  const keyCheck = siteGalleryKeySchema.safeParse({ page, galleryKey });
  if (!keyCheck.success) {
    return { success: false, error: keyCheck.error.issues[0]?.message };
  }
  const reorderCheck = siteGalleryReorderSchema.safeParse({ ids });
  if (!reorderCheck.success) {
    return { success: false, error: reorderCheck.error.issues[0]?.message };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("reorder_site_gallery", {
    p_page: keyCheck.data.page,
    p_gallery_key: keyCheck.data.galleryKey,
    p_ids: reorderCheck.data.ids,
  });

  if (error) {
    console.error("[reorderSiteGalleryItems] RPC error:", error);
    return { success: false, error: formatFriendlyError(error) };
  }

  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "REORDER_SITE_GALLERY",
      entity: "site_gallery_media",
      metadata: {
        page: keyCheck.data.page,
        gallery_key: keyCheck.data.galleryKey,
        count: reorderCheck.data.ids.length,
      },
    });
  }

  revalidateGalleryPaths();
  return { success: true };
}

/**
 * Elimina un elemento de la galería, remueve sus archivos de Storage si aplica
 * y renombra los órdenes restantes de manera consecutiva (1..N).
 */
async function deleteSiteGalleryItemInternal(
  id: string,
  context: RoleContext,
): Promise<{ success: boolean; error?: string }> {
  const { user } = context;
  const supabase = createAdminClient();

  // 1. Obtener la información del elemento a eliminar
  const { data: item, error: fetchErr } = await supabase
    .from("site_gallery_media")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !item) {
    return { success: false, error: "El elemento de la galería no fue encontrado." };
  }

  // 2. Eliminar la fila de la base de datos
  const { error: deleteErr } = await supabase
    .from("site_gallery_media")
    .delete()
    .eq("id", id);

  if (deleteErr) {
    console.error("[deleteSiteGalleryItem] Delete DB error:", deleteErr);
    return { success: false, error: formatFriendlyError(deleteErr) };
  }

  // 3. Eliminar archivos del bucket si aplica
  await removeStorageObjects([item.storage_path, item.poster_storage_path]);

  // 4. Renumerar el orden de los elementos restantes de forma consecutiva
  const { data: remaining } = await supabase
    .from("site_gallery_media")
    .select("id")
    .eq("page", item.page)
    .eq("gallery_key", item.gallery_key)
    .order("content_order", { ascending: true });

  if (remaining && remaining.length > 0) {
    const remainingIds = remaining.map((r) => r.id);
    await supabase.rpc("reorder_site_gallery", {
      p_page: item.page,
      p_gallery_key: item.gallery_key,
      p_ids: remainingIds,
    });
  }

  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "DELETE_SITE_GALLERY_ITEM",
      entity: "site_gallery_media",
      metadata: {
        id,
        media_type: item.media_type,
        page: item.page,
        gallery_key: item.gallery_key,
      },
    });
  }

  revalidateGalleryPaths();
  return { success: true };
}

// Exportación con protección de rol Admin (8)
export const listSiteGalleryItems = withRole(8, listSiteGalleryItemsInternal);
export const prepareSiteGalleryUpload = withRole(8, prepareSiteGalleryUploadInternal);
export const confirmSiteGalleryUpload = withRole(8, confirmSiteGalleryUploadInternal);
export const discardSiteGalleryUpload = withRole(8, discardSiteGalleryUploadInternal);
export const addSiteGalleryYouTube = withRole(8, addSiteGalleryYouTubeInternal);
export const updateSiteGalleryItem = withRole(8, updateSiteGalleryItemInternal);
export const reorderSiteGalleryItems = withRole(8, reorderSiteGalleryItemsInternal);
export const deleteSiteGalleryItem = withRole(8, deleteSiteGalleryItemInternal);
