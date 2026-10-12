import { z } from "zod";

export const cmsContentSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(200),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  content_order: z.number().int().default(0),
  section_key: z.string().min(1, "La clave de sección es requerida"),
  page: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export const faqSchema = z.object({
  question: z.string().min(1, "La pregunta es requerida").max(500),
  answer: z.string().min(1, "La respuesta es requerida"),
  section_id: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  content_order: z.number().int().default(0),
});

export const faqSectionSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(200),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  content_order: z.number().int().default(0),
});

export type CMSContentInput = z.infer<typeof cmsContentSchema>;
export type FAQInput = z.infer<typeof faqSchema>;
export type FAQSectionInput = z.infer<typeof faqSectionSchema>;

/**
 * Enlace interno editable en el CMS: ruta del sitio (`/programs`, `/programs#colegio`)
 * o ancla de la misma página (`#historia`). Rechaza URLs externas y esquemas como `javascript:`.
 */
export const cmsInternalHrefSchema = z
  .string()
  .trim()
  .regex(/^(\/(?![/\\])|#)[^\s]*$/, "Debe ser una ruta del sitio (/...) o un ancla (#...)");

/** Valor de un contador de la página Nosotros: número entero de hasta 6 cifras. */
export const statValueSchema = z
  .string()
  .trim()
  .regex(/^\d{1,6}$/);

/** Rama del organigrama de Nosotros (`cl_estructura.metadata.ramas[]`). */
export const orgBranchSchema = z.object({
  nombre: z.string().trim().min(1),
  unidades: z.array(z.string().trim().min(1)).catch([]),
});

export type OrgBranch = z.infer<typeof orgBranchSchema>;
