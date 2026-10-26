import { z } from "zod";

/**
 * Esquema de validación para la configuración de Google Ads (matricula_ads).
 */
export const matriculaAdsSchema = z.object({
  schema_version: z.number().int().default(1),
  enabled: z.boolean().default(false),
  tag_id: z
    .string()
    .trim()
    .regex(/^AW-[0-9]+$/, "El ID de Google Ads debe tener el formato AW- seguido de números (ej. AW-18533492300)"),
  page_tag_enabled: z.boolean().default(true),
  allowed_path: z.string().trim().default("/matricula"),
  conversion_enabled: z.boolean().default(false),
  conversion_label: z.string().trim().min(1, "La etiqueta de conversión es requerida"),
  conversion_action_name: z.string().trim().default("Website lead"),
  conversion_event: z.literal("conversion").default("conversion"),
  conversion_value: z.number().nullable().default(null),
  currency: z.string().trim().default("USD"),
  cta_positions: z
    .array(z.enum(["intro", "hero", "cierre", "sticky_mobile"]))
    .default(["intro", "hero", "cierre", "sticky_mobile"]),
  allow_ad_personalization_signals: z.boolean().default(false),
  allow_enhanced_conversions: z.boolean().default(false),
  restricted_data_processing: z.boolean().default(true),
  production_only: z.boolean().default(true),
});

export type MatriculaAdsConfig = z.infer<typeof matriculaAdsSchema>;

/**
 * Esquema de validación para la configuración de WhatsApp (matricula_whatsapp).
 */
export const matriculaWhatsAppSchema = z.object({
  phone_e164: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{6,14}$/, "El teléfono debe cumplir el estándar E.164 (ej. +50377310792)"),
  display_phone: z.string().trim().min(1, "El teléfono para mostrar es requerido"),
  message_template: z
    .string()
    .trim()
    .min(10, "La plantilla del mensaje debe contener al menos 10 caracteres")
    .max(500, "La plantilla del mensaje no debe exceder 500 caracteres"),
  open_mode: z.enum(["same_tab", "new_tab"]).default("same_tab"),
  enabled: z.boolean().default(true),
});

export type MatriculaWhatsAppConfig = z.infer<typeof matriculaWhatsAppSchema>;

/**
 * Esquema de validación para los cupos (matricula_cupos).
 */
export const matriculaCuposSchema = z.object({
  count: z.number().int().min(0, "La cantidad de cupos debe ser mayor o igual a 0"),
  show_count: z.boolean().default(true),
  zero_label: z.string().trim().default("Cupos agotados"),
  updated_label: z.string().trim().default("Actualizado recientemente"),
  last_verified_at: z.string().datetime({ message: "La fecha debe ser un formato ISO 8601 válido" }).optional(),
});

export type MatriculaCuposConfig = z.infer<typeof matriculaCuposSchema>;

/**
 * Esquema de validación para los parámetros UTM de la campaña (matricula_utm).
 */
export const matriculaUtmSchema = z.object({
  schema_version: z.number().int().default(1),
  enabled: z.boolean().default(true),
  campaign_defaults: z.object({
    source: z.string().trim().default("google"),
    medium: z.string().trim().default("cpc"),
    campaign: z.string().trim().default("matricula_2027"),
  }),
  optional_defaults: z.record(z.string(), z.string()).default({}),
  allowed_keys: z
    .array(z.string().trim())
    .default(["utm_source", "utm_medium", "utm_campaign", "utm_id", "utm_content", "utm_term"]),
  approved_sources: z.array(z.string().trim()).default(["google"]),
  approved_campaigns: z.array(z.string().trim()).default(["matricula_2027"]),
  capture_model: z.literal("last_explicit_utm_in_session").default("last_explicit_utm_in_session"),
  storage_mode: z.enum(["session", "memory"]).default("session"),
  ttl_minutes: z.number().int().min(1).max(1440).default(30),
  persist_to_submission: z.boolean().default(true),
  include_in_whatsapp: z.boolean().default(false),
});

export type MatriculaUtmConfig = z.infer<typeof matriculaUtmSchema>;

/**
 * Objeto de atribución persistido en contact_submissions.attribution.
 */
export const attributionObjectSchema = z
  .object({
    schema_version: z.number().int().default(1),
    utm_source: z.string().trim().max(100).optional(),
    utm_medium: z.string().trim().max(100).optional(),
    utm_campaign: z.string().trim().max(100).optional(),
    utm_id: z.string().trim().max(100).optional(),
    utm_content: z.string().trim().max(100).optional(),
    utm_term: z.string().trim().max(100).optional(),
    entry_path: z.string().trim().max(200).default("/matricula"),
    capture_model: z.string().trim().default("last_explicit_utm_in_session"),
    captured_at: z.string().optional(),
  })
  .nullable();

export type AttributionObject = z.infer<typeof attributionObjectSchema>;

/**
 * Esquema de envío de solicitud desde el formulario modal de matrícula.
 */
export const matriculaContactSubmissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre completo debe tener al menos 2 caracteres")
    .max(150, "El nombre no puede exceder 150 caracteres"),
  email: z
    .string()
    .trim()
    .email("Ingrese un correo electrónico válido")
    .max(254, "El correo no puede exceder 254 caracteres"),
  phone: z
    .string()
    .trim()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional()
    .refine(
      (val) => val === null || val === undefined || /^[0-9+\s\-().]{6,25}$/.test(val),
      "El número de teléfono tiene un formato no válido"
    ),
  type: z
    .string()
    .trim()
    .min(1, "Seleccione un tipo de consulta")
    .max(100, "El tipo de consulta no puede exceder 100 caracteres"),
  message: z
    .string()
    .trim()
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(2000, "El mensaje no puede exceder 2000 caracteres"),
  idempotency_key: z.string().uuid("Clave de idempotencia inválida").optional(),
  attribution: attributionObjectSchema.optional().default(null),
  // Campo trampa para protección antispam (Honeypot)
  hp_field: z.string().optional(),
});

export type MatriculaContactSubmission = z.infer<typeof matriculaContactSubmissionSchema>;
