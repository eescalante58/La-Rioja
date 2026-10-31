import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { textOr, metaHref, type CmsSection } from "@/lib/cms-content";
import {
  CONTAINER,
  SECTION_ANCHOR,
  SECTION_PLAIN,
  SECTION_Y,
  H2,
  MUTED,
  BTN_NAVY,
} from "@/components/site/section-ui";
import { FacilitiesMosaic } from "./FacilitiesMosaic";
import { instalacionesMetaSchema } from "@/lib/validation/site-gallery";
import type { SiteGalleryItem } from "@/types/cms";

interface FacilitiesGalleryProps {
  /** Fila de site_content con section_key = 'cl_instalaciones'. */
  intro: CmsSection | undefined;
  /** Elementos activos de la galería (fotos, videos y YouTube). */
  items: SiteGalleryItem[];
}

/**
 * Sección «Conoce nuestras instalaciones» (#instalaciones) para /about.
 * Server Component con alternancia de fondo blanco (SECTION_PLAIN)
 * entre el modelo solidario (gris) y el cierre (oscuro).
 */
export function FacilitiesGallery({ intro, items }: FacilitiesGalleryProps) {
  if (items.length === 0) return null;

  const parsedMeta = instalacionesMetaSchema.safeParse(intro?.metadata || {});
  const meta = parsedMeta.success
    ? parsedMeta.data
    : {
        chip: "Instalaciones",
        fotos_visibles: 5 as const,
        mostrar_leyendas: true,
        boton: "",
        enlace: "",
      };

  const title = textOr(intro?.title, "Conoce nuestras instalaciones");
  const description = textOr(intro?.description, "");
  const buttonText = meta.boton.trim();
  const buttonHref = meta.enlace.trim();
  const hasButton = Boolean(buttonText && buttonHref);

  return (
    <section
      id="instalaciones"
      aria-labelledby="instalaciones-titulo"
      className={`${SECTION_PLAIN} ${SECTION_ANCHOR}`}
    >
      <div className={`${CONTAINER} ${SECTION_Y} flex flex-col gap-8 md:gap-10`}>
        {/* Encabezado de la sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-3 max-w-3xl">
            <h2 id="instalaciones-titulo" className={`${H2} m-0`}>
              {title}
            </h2>
            {description && (
              <p className={`m-0 text-base md:text-lg leading-relaxed ${MUTED}`}>
                {description}
              </p>
            )}
          </div>

          {hasButton && (
            <div className="flex-shrink-0">
              <Link
                href={buttonHref}
                className={`${BTN_NAVY} rounded-full inline-flex items-center gap-2`}
              >
                {buttonText}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>

        {/* Mosaico interactivo (cliente) */}
        <FacilitiesMosaic
          items={items}
          visibleCount={meta.fotos_visibles}
          showCaptions={meta.mostrar_leyendas}
        />
      </div>
    </section>
  );
}
