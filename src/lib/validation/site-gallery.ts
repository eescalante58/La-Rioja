import { z } from "zod";
import { extractYouTubeId } from "@/lib/video-url";
import { cmsInternalHrefSchema } from "./cms";

export const SITE_GALLERY_BUCKET = "site_gallery";
export const SITE_GALLERY_MAX_ITEMS = 30;
export const SITE_GALLERY_IMAGE_MAX_BYTES = 4 * 1024 * 1024; // 4 MB (post-compresión WebP)
export const SITE_GALLERY_VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50 MB
export const SITE_GALLERY_ALLOWED_IMAGE_TYPES = [
  "image/webp",
  "image/jpeg",
  "image/png",
] as const;
export const SITE_GALLERY_ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
] as const;

export const sitePageTypeSchema = z.enum([
  "home",
  "about",
  "quienes somos",
  "bingo",
  "tombola",
  "programs",
  "productos",
  "services",
  "apoyanos",
  "privacidad",
  "matricula",
  "footer",
  "contact",
  "global",
  "social media",
  "whatsapp message",
]);

export type SitePageType = z.infer<typeof sitePageTypeSchema>;

/**
 * Validador para la clave compuesta de una galería institucional.
 */
export const siteGalleryKeySchema = z.object({
  page: sitePageTypeSchema,
  galleryKey: z
    .string()
    .trim()
    .regex(/^cl_[a-z0-9_]+$/, "La clave de la galería debe comenzar con 'cl_' y contener caracteres alfanuméricos"),
});

/**
 * Entrada para solicitar URL de subida firmada directa a Storage.
 */
export const siteGalleryPrepareSchema = z.object({
  kind: z.enum(["image", "video"]),
  contentType: z.string().trim(),
  size: z.number().int().positive(),
  fileName: z.string().trim().min(1).max(200),
  posterContentType: z.literal("image/webp").optional(),
});

export type SiteGalleryPrepareInput = z.infer<typeof siteGalleryPrepareSchema>;

/**
 * Confirmación de archivo ya subido mediante URL firmada.
 */
export const siteGalleryConfirmSchema = z.object({
  kind: z.enum(["image", "video"]),
  path: z.string().trim().min(5),
  posterPath: z.string().trim().optional(),
  durationSeconds: z.number().int().min(1).max(7200).nullable().optional(),
  fileName: z.string().trim().min(1),
});

export type SiteGalleryConfirmInput = z.infer<typeof siteGalleryConfirmSchema>;

/**
 * Entrada para registrar un video de YouTube mediante su URL.
 */
export const siteGalleryYouTubeSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Ingrese un enlace de YouTube")
    .refine((url) => Boolean(extractYouTubeId(url)), {
      message: "El enlace proporcionado no es un video válido de YouTube",
    }),
});

/**
 * Actualización parcial de metadatos de un elemento de galería.
 */
export const siteGalleryItemUpdateSchema = z
  .object({
    alt_text: z
      .string()
      .trim()
      .min(5, "El texto alternativo debe tener al menos 5 caracteres")
      .max(150, "El texto alternativo no debe exceder 150 caracteres")
      .optional(),
    caption: z
      .string()
      .trim()
      .max(60, "La leyenda no debe exceder 60 caracteres")
      .transform((val) => (val === "" ? null : val))
      .nullable()
      .optional(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.alt_text !== undefined ||
      data.caption !== undefined ||
      data.is_active !== undefined,
    { message: "Debe proporcionar al menos un campo para actualizar" },
  );

export type SiteGalleryItemUpdateInput = z.infer<
  typeof siteGalleryItemUpdateSchema
>;

/**
 * Reordenamiento atómico de la galería por lista ordenada de IDs.
 */
export const siteGalleryReorderSchema = z.object({
  ids: z
    .array(z.string().uuid("Identificador inválido"))
    .min(1, "Debe enviar al menos un elemento")
    .max(SITE_GALLERY_MAX_ITEMS, `Máximo ${SITE_GALLERY_MAX_ITEMS} elementos`)
    .refine((items) => new Set(items).size === items.length, {
      message: "La lista de identificadores no debe contener duplicados",
    }),
});

/**
 * Metadatos configurables de la sección cl_instalaciones en site_content.
 */
export const instalacionesMetaSchema = z.object({
  chip: z
    .string()
    .trim()
    .max(24, "El texto del chip no puede exceder 24 caracteres")
    .catch("Instalaciones"),
  fotos_visibles: z
    .union([z.literal(5), z.literal(9)])
    .catch(5),
  mostrar_leyendas: z.boolean().catch(true),
  boton: z
    .string()
    .trim()
    .max(40, "El texto del botón no puede exceder 40 caracteres")
    .catch(""),
  enlace: z
    .string()
    .trim()
    .refine(
      (val) => val === "" || cmsInternalHrefSchema.safeParse(val).success,
      {
        message: "El enlace debe ser una ruta interna del sitio (/...) o un ancla (#...)",
      },
    )
    .catch(""),
});

export type InstalacionesMeta = z.infer<typeof instalacionesMetaSchema>;
