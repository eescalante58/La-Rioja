"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { createAdminClient, createStaticClient } from "@/lib/supabase/server";
import { withRole } from "@/lib/auth/guards";
import { requireCompanyAccess } from "@/lib/auth/authorization";
import {
  CATALOG_PDF_MAX_BYTES,
  catalogSchema,
  lineSchema,
  normalizeProduct,
  productSchema,
  type CatalogInput,
  type LineInput,
  type Product,
  type ProductCatalog,
  type ProductLine,
  type PublicCatalog,
  type ShopAdminData,
  type VariantInput,
} from "@/lib/validation/products";
import { ORDER_STATUSES, type OrderStatus, type ShopOrder } from "@/lib/validation/shop-orders";

/** Nivel mínimo para gestionar la tienda (Editor). */
const MIN_LEVEL = 6;
const BUCKET = "product_images";
const PDF_BUCKET = "product_catalog_pdfs";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const PRODUCT_SELECT = "*, variants:product_variants(*)";

interface RoleContext {
  user: User;
  level: number;
}

type ActionResult<T = undefined> = { success: true; data?: T } | { success: false; error: string };

const byOrder = <T extends { content_order: number; name: string }>(a: T, b: T) =>
  a.content_order - b.content_order || a.name.localeCompare(b.name);

/**
 * Catálogos publicados con sus líneas y productos para /productos.
 * Usa el cliente estático (sin cookies) para permitir ISR; RLS solo expone
 * catálogos, líneas y productos activos (y variantes de productos activos).
 */
export async function getPublicShop(): Promise<PublicCatalog[]> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("product_catalogs")
    .select(`*, lines:product_lines(*, products(${PRODUCT_SELECT}))`)
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching public shop:", error);
    return [];
  }

  type Row = ProductCatalog & {
    lines: (ProductLine & { products: Parameters<typeof normalizeProduct>[0][] })[];
  };
  return ((data ?? []) as Row[])
    .map((c) => ({
      ...c,
      lines: c.lines
        .filter((l) => l.is_active)
        .map((l) => ({
          ...l,
          products: l.products
            .filter((p) => p.is_active)
            .map(normalizeProduct)
            .filter((p) => p.variants.length > 0)
            .sort(byOrder),
        }))
        .filter((l) => l.products.length > 0)
        .sort(byOrder),
    }))
    .filter((c) => c.lines.length > 0)
    .sort(byOrder);
}

/**
 * Catálogos, líneas y productos (publicados y ocultos) de una empresa.
 */
async function listShopInternal(companyId: number): Promise<ActionResult<ShopAdminData>> {
  const access = await requireCompanyAccess(companyId);
  if (!access.authorized) {
    return { success: false, error: access.error ?? "Acceso denegado a la empresa" };
  }

  const supabase = createAdminClient();
  const [catalogs, products] = await Promise.all([
    supabase
      .from("product_catalogs")
      .select("*, lines:product_lines(*)")
      .eq("company_id", companyId),
    supabase.from("products").select(PRODUCT_SELECT).eq("company_id", companyId),
  ]);
  if (catalogs.error) return { success: false, error: catalogs.error.message };
  if (products.error) return { success: false, error: products.error.message };

  const catalogRows = (catalogs.data ?? []) as (ProductCatalog & { lines: ProductLine[] })[];
  return {
    success: true,
    data: {
      catalogs: catalogRows.map(({ lines: _lines, ...c }) => c).sort(byOrder),
      lines: catalogRows.flatMap((c) => c.lines).sort(byOrder),
      products: (products.data ?? []).map(normalizeProduct).sort(byOrder),
    },
  };
}

/**
 * Convierte el FormData del formulario del admin en datos validados.
 */
function parseProductForm(formData: FormData) {
  const text = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  };

  let variants: unknown = [];
  try {
    variants = JSON.parse(String(formData.get("variants") ?? "[]"));
  } catch {
    variants = null;
  }

  return productSchema.safeParse({
    company_id: Number(formData.get("company_id")),
    line_id: Number(formData.get("line_id")),
    name: text("name") ?? "",
    description: text("description"),
    is_active: formData.get("is_active") === "true",
    content_order: Number(formData.get("content_order") ?? 0) || 0,
    variants,
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
async function logActivity(
  user: User,
  action: string,
  metadata: Record<string, unknown>,
  entity = "products",
) {
  await createAdminClient()
    .from("user_activity_log")
    .insert({
      user_id: user.id,
      action,
      entity,
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

/** Empresa dueña de un catálogo, validando el acceso del usuario. */
async function authorizeCatalog(
  catalogId: number,
): Promise<{ companyId?: number; error?: string }> {
  const { data, error } = await createAdminClient()
    .from("product_catalogs")
    .select("company_id")
    .eq("id", catalogId)
    .single();
  if (error || !data) return { error: "Catálogo no encontrado." };
  const access = await requireCompanyAccess(data.company_id);
  if (!access.authorized) return { error: access.error ?? "Acceso denegado a la empresa" };
  return { companyId: data.company_id };
}

/** Empresa dueña de una línea, validando el acceso del usuario. */
async function authorizeLine(lineId: number): Promise<{ companyId?: number; error?: string }> {
  const { data, error } = await createAdminClient()
    .from("product_lines")
    .select("catalog_id")
    .eq("id", lineId)
    .single();
  if (error || !data) return { error: "Línea no encontrada." };
  return authorizeCatalog(data.catalog_id);
}

/** Producto con variantes recién leído (respuesta de las mutaciones). */
async function fetchProduct(id: string): Promise<Product | null> {
  const { data } = await createAdminClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .single();
  return data ? normalizeProduct(data) : null;
}

/**
 * Sincroniza las variantes de un producto: actualiza las existentes, inserta
 * las nuevas y elimina las que ya no vienen (los pedidos conservan su copia).
 */
async function syncVariants(productId: string, variants: VariantInput[]): Promise<string | null> {
  const supabase = createAdminClient();
  const { data: current, error } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);
  if (error) return error.message;

  const currentIds = new Set((current ?? []).map((v) => v.id as number));
  const keepIds = new Set(variants.flatMap((v) => (v.id && currentIds.has(v.id) ? [v.id] : [])));

  const toDelete = [...currentIds].filter((id) => !keepIds.has(id));
  if (toDelete.length > 0) {
    const del = await supabase.from("product_variants").delete().in("id", toDelete);
    if (del.error) return del.error.message;
  }

  for (const [index, v] of variants.entries()) {
    const row = {
      label: v.label || null,
      price: v.price,
      unit: v.unit || null,
      is_available: v.is_available,
      content_order: index,
    };
    const res =
      v.id && keepIds.has(v.id)
        ? await supabase.from("product_variants").update(row).eq("id", v.id)
        : await supabase.from("product_variants").insert({ ...row, product_id: productId });
    if (res.error) return res.error.message;
  }
  return null;
}

function revalidateShop() {
  revalidatePath("/productos");
  revalidatePath("/admin/productos");
}

/**
 * Crea un producto (campos del formulario, `variants` en JSON y archivo opcional `image`).
 */
async function createProductInternal(
  formData: FormData,
  { user }: RoleContext,
): Promise<ActionResult<Product>> {
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const { variants, ...fields } = parsed.data;

  const access = await requireCompanyAccess(fields.company_id);
  if (!access.authorized) {
    return { success: false, error: access.error ?? "Acceso denegado a la empresa" };
  }
  const line = await authorizeLine(fields.line_id);
  if (line.companyId !== fields.company_id) {
    return { success: false, error: line.error ?? "La línea pertenece a otra empresa." };
  }

  let image_url: string | null = null;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const uploaded = await uploadProductImage(fields.company_id, image);
    if (uploaded.error) return { success: false, error: uploaded.error };
    image_url = uploaded.url ?? null;
  }

  const { data, error } = await createAdminClient()
    .from("products")
    .insert({ ...fields, image_url })
    .select("id, name")
    .single();

  if (error) {
    await removeProductImage(image_url);
    return { success: false, error: error.message };
  }

  const variantError = await syncVariants(data.id, variants);
  if (variantError) {
    await createAdminClient().from("products").delete().eq("id", data.id);
    await removeProductImage(image_url);
    return { success: false, error: `No se pudieron guardar los precios: ${variantError}` };
  }

  await logActivity(user, "CREATE_PRODUCT", { id: data.id, name: data.name });
  revalidateShop();
  const product = await fetchProduct(data.id);
  return product
    ? { success: true, data: product }
    : { success: false, error: "Producto no encontrado." };
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
  const { variants, ...fields } = parsed.data;
  if (fields.company_id !== auth.product.company_id) {
    return { success: false, error: "El producto pertenece a otra empresa." };
  }
  const line = await authorizeLine(fields.line_id);
  if (line.companyId !== fields.company_id) {
    return { success: false, error: line.error ?? "La línea pertenece a otra empresa." };
  }

  let image_url = auth.product.image_url;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const uploaded = await uploadProductImage(fields.company_id, image);
    if (uploaded.error) return { success: false, error: uploaded.error };
    image_url = uploaded.url ?? null;
  } else if (formData.get("remove_image") === "true") {
    image_url = null;
  }

  const { error } = await createAdminClient()
    .from("products")
    .update({ ...fields, image_url })
    .eq("id", id);

  if (error) {
    if (image_url !== auth.product.image_url) await removeProductImage(image_url);
    return { success: false, error: error.message };
  }
  if (image_url !== auth.product.image_url) await removeProductImage(auth.product.image_url);

  const variantError = await syncVariants(id, variants);
  if (variantError) {
    return { success: false, error: `No se pudieron guardar los precios: ${variantError}` };
  }

  await logActivity(user, "UPDATE_PRODUCT", { id, name: fields.name });
  revalidateShop();
  const product = await fetchProduct(id);
  return product
    ? { success: true, data: product }
    : { success: false, error: "Producto no encontrado." };
}

/**
 * Publica u oculta un producto en el sitio.
 */
async function setProductActiveInternal(
  id: string,
  value: boolean,
  { user }: RoleContext,
): Promise<ActionResult<Product>> {
  const auth = await authorizeProduct(id);
  if (!auth.product) return { success: false, error: auth.error ?? "Producto no encontrado." };

  const { error } = await createAdminClient()
    .from("products")
    .update({ is_active: value === true })
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  await logActivity(user, "UPDATE_PRODUCT_FLAG", { id, flag: "is_active", value });
  revalidateShop();
  const product = await fetchProduct(id);
  return product
    ? { success: true, data: product }
    : { success: false, error: "Producto no encontrado." };
}

/**
 * Marca una presentación como disponible o agotada.
 */
async function setVariantAvailabilityInternal(
  variantId: number,
  value: boolean,
  { user }: RoleContext,
): Promise<ActionResult<Product>> {
  const { data: variant } = await createAdminClient()
    .from("product_variants")
    .select("product_id")
    .eq("id", variantId)
    .single();
  if (!variant) return { success: false, error: "Presentación no encontrada." };

  const auth = await authorizeProduct(variant.product_id);
  if (!auth.product) return { success: false, error: auth.error ?? "Producto no encontrado." };

  const { error } = await createAdminClient()
    .from("product_variants")
    .update({ is_available: value === true })
    .eq("id", variantId);
  if (error) return { success: false, error: error.message };

  await logActivity(user, "UPDATE_VARIANT_AVAILABILITY", { variantId, value });
  revalidateShop();
  const product = await fetchProduct(variant.product_id);
  return product
    ? { success: true, data: product }
    : { success: false, error: "Producto no encontrado." };
}

/**
 * Reordena los productos de una línea (arrastrar y soltar en el admin).
 * `orderedIds` debe contener exactamente los productos de la línea, en el
 * nuevo orden; `content_order` queda 1, 2, 3…
 */
async function reorderProductsInternal(
  lineId: number,
  orderedIds: string[],
  { user }: RoleContext,
): Promise<ActionResult> {
  if (!Number.isInteger(lineId) || !Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { success: false, error: "Datos de orden inválidos." };
  }
  const line = await authorizeLine(lineId);
  if (!line.companyId) return { success: false, error: line.error ?? "Línea no encontrada." };

  const supabase = createAdminClient();
  const { data: current, error } = await supabase
    .from("products")
    .select("id")
    .eq("line_id", lineId);
  if (error) return { success: false, error: error.message };

  // Mismo conjunto: ni productos ajenos a la línea ni faltantes/duplicados.
  const currentIds = new Set((current ?? []).map((p) => p.id as string));
  const requested = new Set(orderedIds);
  if (
    requested.size !== orderedIds.length ||
    requested.size !== currentIds.size ||
    orderedIds.some((id) => !currentIds.has(id))
  ) {
    return {
      success: false,
      error: "La lista de productos cambió. Recarga la página e inténtalo de nuevo.",
    };
  }

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("products")
        .update({ content_order: index + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { success: false, error: failed.error.message };

  await logActivity(user, "REORDER_PRODUCTS", { lineId, count: orderedIds.length });
  revalidateShop();
  return { success: true };
}

/**
 * Elimina un producto, sus variantes (cascada) y su foto del bucket.
 */
async function deleteProductInternal(id: string, { user }: RoleContext): Promise<ActionResult> {
  const auth = await authorizeProduct(id);
  if (!auth.product) return { success: false, error: auth.error ?? "Producto no encontrado." };

  const { error } = await createAdminClient().from("products").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  await removeProductImage(auth.product.image_url);
  await logActivity(user, "DELETE_PRODUCT", { id, name: auth.product.name });
  revalidateShop();
  return { success: true };
}

/**
 * Crea o actualiza un catálogo (taller).
 */
async function saveCatalogInternal(
  input: CatalogInput,
  { user }: RoleContext,
): Promise<ActionResult<ProductCatalog>> {
  const parsed = catalogSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const { id, ...fields } = parsed.data;

  const access = await requireCompanyAccess(fields.company_id);
  if (!access.authorized) return { success: false, error: access.error ?? "Acceso denegado" };
  if (id) {
    const auth = await authorizeCatalog(id);
    if (auth.companyId !== fields.company_id) {
      return { success: false, error: auth.error ?? "El catálogo pertenece a otra empresa." };
    }
  }

  const supabase = createAdminClient();
  const { data, error } = id
    ? await supabase.from("product_catalogs").update(fields).eq("id", id).select().single()
    : await supabase.from("product_catalogs").insert(fields).select().single();
  if (error) {
    return {
      success: false,
      error:
        error.code === "23505" ? "Ya existe un catálogo con ese identificador." : error.message,
    };
  }

  await logActivity(
    user,
    id ? "UPDATE_CATALOG" : "CREATE_CATALOG",
    { id: data.id, name: data.name },
    "product_catalogs",
  );
  revalidateShop();
  return { success: true, data: data as ProductCatalog };
}

/**
 * Elimina un catálogo y sus líneas. Falla si alguna línea tiene productos.
 */
async function deleteCatalogInternal(id: number, { user }: RoleContext): Promise<ActionResult> {
  const auth = await authorizeCatalog(id);
  if (!auth.companyId) return { success: false, error: auth.error ?? "Catálogo no encontrado." };

  const { data: current } = await createAdminClient()
    .from("product_catalogs")
    .select("pdf_url")
    .eq("id", id)
    .single();
  const { error } = await createAdminClient().from("product_catalogs").delete().eq("id", id);
  if (error) {
    return {
      success: false,
      error:
        error.code === "23503"
          ? "No se puede eliminar: el catálogo tiene productos. Muévelos o elimínalos primero."
          : error.message,
    };
  }
  await removeCatalogPdfFile(current?.pdf_url ?? null);
  await logActivity(user, "DELETE_CATALOG", { id }, "product_catalogs");
  revalidateShop();
  return { success: true };
}

/** Ruta dentro del bucket de PDF a partir de su URL pública (o null). */
function pdfPathFromUrl(url: string | null): string | null {
  if (!url) return null;
  const parts = url.split(`/${PDF_BUCKET}/`);
  return parts.length < 2 ? null : decodeURIComponent(parts[1].split("?")[0]);
}

/** Borra del bucket el PDF de una URL pública (errores solo se registran). */
async function removeCatalogPdfFile(url: string | null) {
  const path = pdfPathFromUrl(url);
  if (!path) return;
  const { error } = await createAdminClient().storage.from(PDF_BUCKET).remove([path]);
  if (error) console.error("Error al borrar PDF de catálogo:", error);
}

/**
 * Prepara la subida directa del PDF de un catálogo a Storage: devuelve una
 * URL de subida firmada (el archivo no pasa por Vercel, que limita las
 * peticiones a ~4.5 MB). El navegador sube con `uploadToSignedUrl` y luego
 * confirma con `setCatalogPdf`.
 */
async function createCatalogPdfUploadInternal(
  catalogId: number,
  fileName: string,
  sizeBytes: number,
): Promise<ActionResult<{ path: string; token: string }>> {
  if (typeof fileName !== "string" || !fileName.toLowerCase().endsWith(".pdf")) {
    return { success: false, error: "El archivo debe ser un PDF." };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > CATALOG_PDF_MAX_BYTES) {
    return { success: false, error: "El PDF debe pesar como máximo 50 MB." };
  }
  const auth = await authorizeCatalog(catalogId);
  if (!auth.companyId) return { success: false, error: auth.error ?? "Catálogo no encontrado." };

  const { data: catalog } = await createAdminClient()
    .from("product_catalogs")
    .select("slug")
    .eq("id", catalogId)
    .single();
  const path = `${auth.companyId}/${catalog?.slug ?? "catalogo"}-${crypto.randomUUID()}.pdf`;

  const { data, error } = await createAdminClient()
    .storage.from(PDF_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) {
    return { success: false, error: `No se pudo preparar la subida: ${error?.message ?? ""}` };
  }
  return { success: true, data: { path: data.path, token: data.token } };
}

/**
 * Confirma el PDF subido: verifica que exista en el bucket y pertenezca a la
 * empresa del catálogo, guarda URL/tamaño/fecha y borra el PDF anterior.
 */
async function setCatalogPdfInternal(
  catalogId: number,
  path: string,
  { user }: RoleContext,
): Promise<ActionResult<ProductCatalog>> {
  const auth = await authorizeCatalog(catalogId);
  if (!auth.companyId) return { success: false, error: auth.error ?? "Catálogo no encontrado." };
  if (
    typeof path !== "string" ||
    !path.startsWith(`${auth.companyId}/`) ||
    !path.endsWith(".pdf")
  ) {
    return { success: false, error: "Ruta de archivo inválida." };
  }

  const supabase = createAdminClient();
  const storage = supabase.storage.from(PDF_BUCKET);
  const { data: info, error: infoError } = await storage.info(path);
  if (infoError || !info) {
    return { success: false, error: "No se encontró el PDF subido. Intenta de nuevo." };
  }

  const { data: current } = await supabase
    .from("product_catalogs")
    .select("pdf_url")
    .eq("id", catalogId)
    .single();

  const pdf_url = storage.getPublicUrl(path).data.publicUrl;
  const { data, error } = await supabase
    .from("product_catalogs")
    .update({
      pdf_url,
      pdf_size_bytes: info.size ?? null,
      pdf_updated_at: new Date().toISOString(),
    })
    .eq("id", catalogId)
    .select()
    .single();
  if (error) {
    await storage.remove([path]);
    return { success: false, error: error.message };
  }

  if (current?.pdf_url && current.pdf_url !== pdf_url) await removeCatalogPdfFile(current.pdf_url);
  await logActivity(
    user,
    "SET_CATALOG_PDF",
    { id: catalogId, path, size: info.size ?? null },
    "product_catalogs",
  );
  revalidateShop();
  return { success: true, data: data as ProductCatalog };
}

/**
 * Descarta un PDF subido que no se llegó a confirmar (p. ej. si falló
 * `setCatalogPdf`). Solo borra rutas de la empresa del catálogo que no sean
 * el PDF vigente.
 */
async function discardCatalogPdfUploadInternal(
  catalogId: number,
  path: string,
): Promise<ActionResult> {
  const auth = await authorizeCatalog(catalogId);
  if (!auth.companyId) return { success: false, error: auth.error ?? "Catálogo no encontrado." };
  if (typeof path !== "string" || !path.startsWith(`${auth.companyId}/`)) {
    return { success: false, error: "Ruta de archivo inválida." };
  }
  const { data: current } = await createAdminClient()
    .from("product_catalogs")
    .select("pdf_url")
    .eq("id", catalogId)
    .single();
  if (pdfPathFromUrl(current?.pdf_url ?? null) === path) return { success: true };
  await createAdminClient().storage.from(PDF_BUCKET).remove([path]);
  return { success: true };
}

/**
 * Quita el PDF de un catálogo (borra el archivo del bucket).
 */
async function removeCatalogPdfInternal(
  catalogId: number,
  { user }: RoleContext,
): Promise<ActionResult<ProductCatalog>> {
  const auth = await authorizeCatalog(catalogId);
  if (!auth.companyId) return { success: false, error: auth.error ?? "Catálogo no encontrado." };

  const supabase = createAdminClient();
  const { data: current } = await supabase
    .from("product_catalogs")
    .select("pdf_url")
    .eq("id", catalogId)
    .single();
  const { data, error } = await supabase
    .from("product_catalogs")
    .update({ pdf_url: null, pdf_size_bytes: null, pdf_updated_at: null })
    .eq("id", catalogId)
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  await removeCatalogPdfFile(current?.pdf_url ?? null);
  await logActivity(user, "REMOVE_CATALOG_PDF", { id: catalogId }, "product_catalogs");
  revalidateShop();
  return { success: true, data: data as ProductCatalog };
}

/**
 * Crea o actualiza una línea de productos.
 */
async function saveLineInternal(
  input: LineInput,
  { user }: RoleContext,
): Promise<ActionResult<ProductLine>> {
  const parsed = lineSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const { id, ...fields } = parsed.data;

  const target = await authorizeCatalog(fields.catalog_id);
  if (!target.companyId)
    return { success: false, error: target.error ?? "Catálogo no encontrado." };
  if (id) {
    const current = await authorizeLine(id);
    if (current.companyId !== target.companyId) {
      return { success: false, error: current.error ?? "La línea pertenece a otra empresa." };
    }
  }

  const supabase = createAdminClient();
  const { data, error } = id
    ? await supabase.from("product_lines").update(fields).eq("id", id).select().single()
    : await supabase.from("product_lines").insert(fields).select().single();
  if (error) {
    return {
      success: false,
      error:
        error.code === "23505"
          ? "Ya existe una línea con ese nombre en el catálogo."
          : error.message,
    };
  }

  await logActivity(
    user,
    id ? "UPDATE_LINE" : "CREATE_LINE",
    { id: data.id, name: data.name },
    "product_lines",
  );
  revalidateShop();
  return { success: true, data: data as ProductLine };
}

/**
 * Elimina una línea. Falla si tiene productos.
 */
async function deleteLineInternal(id: number, { user }: RoleContext): Promise<ActionResult> {
  const auth = await authorizeLine(id);
  if (!auth.companyId) return { success: false, error: auth.error ?? "Línea no encontrada." };

  const { error } = await createAdminClient().from("product_lines").delete().eq("id", id);
  if (error) {
    return {
      success: false,
      error:
        error.code === "23503"
          ? "No se puede eliminar: la línea tiene productos. Muévelos o elimínalos primero."
          : error.message,
    };
  }
  await logActivity(user, "DELETE_LINE", { id }, "product_lines");
  revalidateShop();
  return { success: true };
}

/**
 * Pedidos de la empresa (más recientes primero), opcionalmente por estado.
 */
async function listOrdersInternal(
  companyId: number,
  status: OrderStatus | null,
): Promise<ActionResult<ShopOrder[]>> {
  const access = await requireCompanyAccess(companyId);
  if (!access.authorized) {
    return { success: false, error: access.error ?? "Acceso denegado a la empresa" };
  }

  let query = createAdminClient()
    .from("shop_orders")
    .select(
      "id, order_number, company_id, customer_name, customer_phone, customer_email, notes, total, status, created_at, updated_at, items:shop_order_items(id, variant_id, product_name, variant_label, unit, unit_price, quantity, subtotal)",
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(300);
  if (status && ORDER_STATUSES.includes(status)) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };

  type Row = Omit<ShopOrder, "total" | "items"> & {
    total: number | string;
    items: (Omit<ShopOrder["items"][number], "unit_price" | "subtotal"> & {
      unit_price: number | string;
      subtotal: number | string;
    })[];
  };
  return {
    success: true,
    data: ((data ?? []) as Row[]).map((o) => ({
      ...o,
      total: Number(o.total),
      items: o.items
        .map((i) => ({ ...i, unit_price: Number(i.unit_price), subtotal: Number(i.subtotal) }))
        .sort((a, b) => (a.id ?? 0) - (b.id ?? 0)),
    })),
  };
}

/**
 * Cambia el estado de un pedido.
 */
async function updateOrderStatusInternal(
  orderId: string,
  status: OrderStatus,
  { user }: RoleContext,
): Promise<ActionResult> {
  if (!ORDER_STATUSES.includes(status)) return { success: false, error: "Estado inválido." };

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("shop_orders")
    .select("company_id, order_number")
    .eq("id", orderId)
    .single();
  if (!order) return { success: false, error: "Pedido no encontrado." };

  const access = await requireCompanyAccess(order.company_id);
  if (!access.authorized) return { success: false, error: access.error ?? "Acceso denegado" };

  const { error } = await supabase.from("shop_orders").update({ status }).eq("id", orderId);
  if (error) return { success: false, error: error.message };

  await logActivity(
    user,
    "UPDATE_ORDER_STATUS",
    { orderId, order_number: order.order_number, status },
    "shop_orders",
  );
  return { success: true };
}

export const listShop = withRole(MIN_LEVEL, listShopInternal);
export const createProduct = withRole(MIN_LEVEL, createProductInternal);
export const updateProduct = withRole(MIN_LEVEL, updateProductInternal);
export const setProductActive = withRole(MIN_LEVEL, setProductActiveInternal);
export const setVariantAvailability = withRole(MIN_LEVEL, setVariantAvailabilityInternal);
export const deleteProduct = withRole(MIN_LEVEL, deleteProductInternal);
export const reorderProducts = withRole(MIN_LEVEL, reorderProductsInternal);
export const saveCatalog = withRole(MIN_LEVEL, saveCatalogInternal);
export const deleteCatalog = withRole(MIN_LEVEL, deleteCatalogInternal);
export const createCatalogPdfUpload = withRole(MIN_LEVEL, createCatalogPdfUploadInternal);
export const setCatalogPdf = withRole(MIN_LEVEL, setCatalogPdfInternal);
export const discardCatalogPdfUpload = withRole(MIN_LEVEL, discardCatalogPdfUploadInternal);
export const removeCatalogPdf = withRole(MIN_LEVEL, removeCatalogPdfInternal);
export const saveLine = withRole(MIN_LEVEL, saveLineInternal);
export const deleteLine = withRole(MIN_LEVEL, deleteLineInternal);
export const listOrders = withRole(MIN_LEVEL, listOrdersInternal);
export const updateOrderStatus = withRole(MIN_LEVEL, updateOrderStatusInternal);
