import { z } from "zod";

/*
 * La Rioja Shop: catálogo (taller) → línea → producto → variantes.
 * Tablas: product_catalogs, product_lines, products, product_variants
 * (migraciones 20261017000000_shop_catalog.sql y siguientes).
 */

/** Catálogo de un taller (Arte y Costura, Panadería). */
export interface ProductCatalog {
  id: number;
  company_id: number;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  cover_image_url: string | null;
  content_order: number;
  is_active: boolean;
}

/** Línea de productos dentro de un catálogo (Tote Bags, Toallas…). */
export interface ProductLine {
  id: number;
  catalog_id: number;
  name: string;
  description: string | null;
  slogan: string | null;
  content_order: number;
  is_active: boolean;
}

/** Presentación con precio de un producto. `label` nulo = presentación única. */
export interface ProductVariant {
  id: number;
  product_id: string;
  label: string | null;
  price: number;
  unit: string | null;
  is_available: boolean;
  content_order: number;
}

/** Producto con sus variantes (ordenadas por `content_order`). */
export interface Product {
  id: string;
  company_id: number;
  line_id: number | null;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  content_order: number;
  created_at: string;
  updated_at: string;
  variants: ProductVariant[];
}

/** Catálogo público con sus líneas y productos publicados. */
export interface PublicCatalog extends ProductCatalog {
  lines: (ProductLine & { products: Product[] })[];
}

/** Datos completos para el admin de /admin/productos. */
export interface ShopAdminData {
  catalogs: ProductCatalog[];
  lines: ProductLine[];
  products: Product[];
}

/** Variante tal como llega del formulario (`id` solo si ya existe). */
export const variantInputSchema = z.object({
  id: z.number().int().positive().optional(),
  label: z.string().trim().max(40).nullable(),
  price: z.number({ error: "Precio inválido" }).min(0, "El precio no puede ser negativo"),
  unit: z.string().trim().max(40).nullable(),
  is_available: z.boolean(),
});

export type VariantInput = z.infer<typeof variantInputSchema>;

/**
 * Datos editables de un producto (formulario de /admin/productos).
 * Las variantes llegan como JSON en el campo `variants` del FormData.
 */
export const productSchema = z
  .object({
    company_id: z.number().int().positive("Empresa requerida"),
    line_id: z.number({ error: "Selecciona una línea" }).int().positive("Selecciona una línea"),
    name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(120),
    description: z.string().trim().max(1000).nullable(),
    is_active: z.boolean(),
    content_order: z.number().int().min(0),
    variants: z
      .array(variantInputSchema)
      .min(1, "Agrega al menos un precio")
      .max(10, "Máximo 10 presentaciones"),
  })
  .refine((p) => p.variants.length === 1 || p.variants.every((v) => v.label), {
    message: "Con varias presentaciones, cada una necesita un nombre (p. ej. Pequeño / Grande).",
    path: ["variants"],
  });

export type ProductInput = z.infer<typeof productSchema>;

/** Formulario de catálogo (taller). */
export const catalogSchema = z.object({
  id: z.number().int().positive().optional(),
  company_id: z.number().int().positive(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Identificador: minúsculas, números y guiones"),
  name: z.string().trim().min(2, "Nombre requerido").max(80),
  tagline: z.string().trim().max(160).nullable(),
  description: z.string().trim().max(2000).nullable(),
  content_order: z.number().int().min(0),
  is_active: z.boolean(),
});

export type CatalogInput = z.infer<typeof catalogSchema>;

/** Formulario de línea de productos. */
export const lineSchema = z.object({
  id: z.number().int().positive().optional(),
  catalog_id: z.number().int().positive("Selecciona un catálogo"),
  name: z.string().trim().min(2, "Nombre requerido").max(80),
  description: z.string().trim().max(1000).nullable(),
  slogan: z.string().trim().max(160).nullable(),
  content_order: z.number().int().min(0),
  is_active: z.boolean(),
});

export type LineInput = z.infer<typeof lineSchema>;

/** Precio mínimo de un producto (para ordenar o mostrar «desde»). */
export function minPrice(product: Pick<Product, "variants">): number | null {
  if (product.variants.length === 0) return null;
  return Math.min(...product.variants.map((v) => v.price));
}

/** Normaliza una fila de Supabase (numeric puede llegar como string). */
export function normalizeProduct(row: Omit<Product, "variants"> & { variants?: unknown }): Product {
  const variants = (Array.isArray(row.variants) ? row.variants : []) as ProductVariant[];
  return {
    ...row,
    variants: variants
      .map((v) => ({ ...v, price: Number(v.price) }))
      .sort((a, b) => a.content_order - b.content_order || a.id - b.id),
  };
}
