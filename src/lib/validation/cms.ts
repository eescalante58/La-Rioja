import { z } from "zod";

export const cmsContentSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(200),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  content_order: z.number().int().default(0),
  section_key: z.string().min(1, "La clave de sección es requerida"),
  page: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
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
