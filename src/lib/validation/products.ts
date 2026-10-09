import { z } from "zod";

/** Categorías sugeridas en el formulario del admin (el campo admite texto libre). */
export const PRODUCT_CATEGORIES = [
  "Panadería",
  "Repostería",
  "Artesanías",
  "Manualidades",
  "Bisutería",
  "Otros",
] as const;

/**
 * Datos editables de un producto (formulario de /admin/productos).
 * `price` nulo = «Precio a consultar».
 */
export const productSchema = z.object({
  company_id: z.number().int().positive("Empresa requerida"),
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(120),
  description: z.string().trim().max(1000).nullable(),
  category: z.string().trim().min(2, "Categoría requerida").max(60),
  price: z.number().min(0, "El precio no puede ser negativo").nullable(),
  unit: z.string().trim().max(40).nullable(),
  is_available: z.boolean(),
  is_active: z.boolean(),
  content_order: z.number().int().min(0),
});

export type ProductInput = z.infer<typeof productSchema>;

/** Fila de `public.products`. */
export interface Product extends ProductInput {
  id: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}
