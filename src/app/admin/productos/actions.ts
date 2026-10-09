"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { createAdminClient, createStaticClient } from "@/lib/supabase/server";
import { withRole } from "@/lib/auth/guards";
import { requireCompanyAccess } from "@/lib/auth/authorization";
import { productSchema, type Product } from "@/lib/validation/products";

/** Nivel mínimo para gestionar productos (Editor). */
const MIN_LEVEL = 6;
const BUCKET = "product_images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface RoleContext {
  user: User;
  level: number;
}

type ActionResult<T = undefined> = { success: true; data?: T } | { success: false; error: string };

/**
 * Productos publicados para la página pública /productos.
 * Usa el cliente estático (sin cookies) para permitir ISR; la política RLS
 * solo expone filas con `is_active = true`.
 */
export async function getPublicProducts(): Promise<Product[]> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("content_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching public products:", error);
    return [];
  }
  return (data ?? []) as Product[];
}

/**
 * Lista todos los productos (publicados y ocultos) de una empresa.
 */
async function listProductsInternal(companyId: number): Promise<ActionResult<Product[]>> {
  const access = await requireCompanyAccess(companyId);
  if (!access.authorized) {
    return { success: false, error: access.error ?? "Acceso denegado a la empresa" };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("company_id", companyId)
    .order("category", { ascending: true })
    .order("content_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as Product[] };
}

/**
 * Convierte el FormData del formulario del admin en datos validados.
 */
function parseProductForm(formData: FormData) {
  const text = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  };
  const priceRaw = text("price");

  return productSchema.safeParse({
    company_id: Number(formData.get("company_id")),
    name: text("name") ?? "",
    description: text("description"),
    category: text("category") ?? "",
    price: priceRaw === null ? null : Number(priceRaw.replace(",", ".")),
    unit: text("unit"),
    is_available: formData.get("is_available") === "true",
    is_active: formData.get("is_active") === "true",
    content_order: Number(formData.get("content_order") ?? 0) || 0,
  });
}

/**
 * Sube la imagen del producto al bucket y devuelve su URL pública.
 */
async function uploadProductImage(
  companyId: number,
  file: File,
): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith("image/")) return { error: "El archivo debe ser una imagen." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "La imagen supera 5 MB." };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${companyId}/${crypto.randomUUID()}.${ext}`;
  const supabase = createAdminClient();

  const { error } = await supabase.storage.from(BUCKET).upload(path, await file.arrayBuffer(), {
    cacheControl: "3600",
    contentType: file.type,
  });
  if (error) return { error: `Error al subir la imagen: ${error.message}` };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

/**
 * Borra del bucket la imagen asociada a una URL pública (errores solo se registran).
 */
async function removeProductImage(imageUrl: string | null) {
  if (!imageUrl) return;
  const parts = imageUrl.split(`/${BUCKET}/`);
  if (parts.length < 2) return;
  const { error } = await createAdminClient()
    .storage.from(BUCKET)
    .remove([parts[1].split("?")[0]]);
  if (error) console.error("Error al borrar imagen de producto:", error);
}

/** Registra la operación en la bitácora de actividad. */
async function logActivity(user: User, action: string, metadata: Record<string, unknown>) {
  await createAdminClient()
    .from("user_activity_log")
    .insert({
      user_id: user.id,
      action,
      entity: "products",
      metadata: { ...metadata, timestamp: new Date().toISOString() },
    });
}

/** Lee el `company_id` de un producto y valida que el usuario pertenezca a esa empresa. */
async function authorizeProduct(
  id: string,
): Promise<{ product?: Pick<Product, "company_id" | "image_url" | "name">; error?: string }> {
  const { data, error } = await createAdminClient()
    .from("products")
    .select("company_id, image_url, name")
    .eq("id", id)
    .single();
  if (error || !data) return { error: "Producto no encontrado." };

  const access = await requireCompanyAccess(data.company_id);
  if (!access.authorized) return { error: access.error ?? "Acceso denegado a la empresa" };
  return { product: data };
}

function revalidateProducts() {
  revalidatePath("/productos");
  revalidatePath("/admin/productos");
}

/**
 * Crea un producto (campos del formulario + archivo opcional `image`).
 */
async function createProductInternal(
  formData: FormData,
  { user }: RoleContext,
): Promise<ActionResult<Product>> {
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const access = await requireCompanyAccess(parsed.data.company_id);
  if (!access.authorized) {
    return { success: false, error: access.error ?? "Acceso denegado a la empresa" };
  }

  let image_url: string | null = null;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const uploaded = await uploadProductImage(parsed.data.company_id, image);
    if (uploaded.error) return { success: false, error: uploaded.error };
    image_url = uploaded.url ?? null;
  }

  const { data, error } = await createAdminClient()
    .from("products")
    .insert({ ...parsed.data, image_url })
    .select()
    .single();

  if (error) {
    await removeProductImage(image_url);
    return { success: false, error: error.message };
  }

  await logActivity(user, "CREATE_PRODUCT", { id: data.id, name: data.name });
  revalidateProducts();
  return { success: true, data: data as Product };
}

/**
 * Actualiza un producto (`id` en el FormData). Si llega `image` reemplaza la
 * foto; si `remove_image === "true"` la elimina.
 */
async function updateProductInternal(
  formData: FormData,
  { user }: RoleContext,
): Promise<ActionResult<Product>> {
  const id = String(formData.get("id") ?? "");
  const auth = await authorizeProduct(id);
  if (!auth.product) return { success: false, error: auth.error ?? "Producto no encontrado." };

  const parsed = parseProductForm(formData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  if (parsed.data.company_id !== auth.product.company_id) {
    return { success: false, error: "El producto pertenece a otra empresa." };
  }

  let image_url = auth.product.image_url;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const uploaded = await uploadProductImage(parsed.data.company_id, image);
    if (uploaded.error) return { success: false, error: uploaded.error };
    image_url = uploaded.url ?? null;
  } else if (formData.get("remove_image") === "true") {
    image_url = null;
  }

  const { data, error } = await createAdminClient()
    .from("products")
    .update({ ...parsed.data, image_url })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (image_url !== auth.product.image_url) await removeProductImage(image_url);
    return { success: false, error: error.message };
  }
  if (image_url !== auth.product.image_url) await removeProductImage(auth.product.image_url);

  await logActivity(user, "UPDATE_PRODUCT", { id, name: data.name });
  revalidateProducts();
  return { success: true, data: data as Product };
}

/**
 * Cambia un indicador booleano (`is_available` o `is_active`) de un producto.
 */
async function setProductFlagInternal(
  id: string,
  flag: "is_available" | "is_active",
  value: boolean,
  { user }: RoleContext,
): Promise<ActionResult<Product>> {
  if (flag !== "is_available" && flag !== "is_active") {
    return { success: false, error: "Campo inválido." };
  }
  const auth = await authorizeProduct(id);
  if (!auth.product) return { success: false, error: auth.error ?? "Producto no encontrado." };

  const { data, error } = await createAdminClient()
    .from("products")
    .update({ [flag]: value === true })
    .eq("id", id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  await logActivity(user, "UPDATE_PRODUCT_FLAG", { id, flag, value });
  revalidateProducts();
  return { success: true, data: data as Product };
}

/**
 * Elimina un producto y su foto del bucket.
 */
async function deleteProductInternal(id: string, { user }: RoleContext): Promise<ActionResult> {
  const auth = await authorizeProduct(id);
  if (!auth.product) return { success: false, error: auth.error ?? "Producto no encontrado." };

  const { error } = await createAdminClient().from("products").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  await removeProductImage(auth.product.image_url);
  await logActivity(user, "DELETE_PRODUCT", { id, name: auth.product.name });
  revalidateProducts();
  return { success: true };
}

export const listProducts = withRole(MIN_LEVEL, listProductsInternal);
export const createProduct = withRole(MIN_LEVEL, createProductInternal);
export const updateProduct = withRole(MIN_LEVEL, updateProductInternal);
export const setProductFlag = withRole(MIN_LEVEL, setProductFlagInternal);
export const deleteProduct = withRole(MIN_LEVEL, deleteProductInternal);
