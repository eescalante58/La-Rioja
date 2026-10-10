import type { LucideIcon } from "lucide-react";
import type { Tables } from "@/types/database";

/**
 * Tipos del contenido administrable (CMS) que consumen las páginas
 * públicas y el gestor /admin/cms.
 */

/** Fila de `site_content`. */
export type SiteContent = Tables<"site_content">;

/** Fila de `faqs`. */
export type Faq = Tables<"faqs">;

/** Mapa de nombres de icono (guardados en el CMS) a componentes de lucide-react. */
export type CmsIconMap = Record<string, LucideIcon>;

/**
 * Ítem de `site_content.metadata`. El CMS guarda JSON libre por sección;
 * cada página lee solo los campos que conoce, por eso todos son opcionales.
 */
export interface CmsItem {
  id?: string | number;
  title?: string;
  desc?: string;
  description?: string;
  content?: string;
  icon?: string;
  image_url?: string;
  color?: string;
  textColor?: string;
  bg?: string;
  border?: string;
  dot?: string;
  /** Lista de viñetas de una tarjeta. */
  items?: string[];
  label?: string;
  val?: string;
  number?: string | number;
  role?: string;
  spec?: string;
  year?: string;
  event?: string;
  variant?: string;
  link?: string;
  buttonText?: string;
  title_font_size?: string;
  title_font_color?: string;
  desc_font_size?: string;
  desc_font_color?: string;
}

/**
 * Sección de contenido renderizada como tarjeta (servicios de la home):
 * una fila de `site_content` o un respaldo estático con la misma forma.
 */
export interface CmsCard {
  id?: string;
  title?: string | null;
  description?: string | null;
  desc?: string;
  image_url?: string | null;
  metadata?: CmsItem | null;
}

/** Contenido del hero principal (`home/hero_main`). */
export type HeroContent = Pick<SiteContent, "title" | "description" | "image_url">;
