import React from "react";
import Link from "next/link";
import { ArrowRight, MapPin, ArrowUpRight } from "lucide-react";
import { textOr, type CmsSection } from "@/lib/cms-content";
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
import { FacilitiesVisitCta } from "./FacilitiesVisitCta";
import { instalacionesMetaSchema } from "@/lib/validation/site-gallery";
import type { SiteGalleryItem } from "@/types/cms";
import type { AdmissionModalConfig } from "@/components/programs/AdmissionSteps";

interface FacilitiesGalleryProps {
  /** Fila de site_content con section_key = 'cl_instalaciones'. */
  intro: CmsSection | undefined;
  /** Elementos activos de la galería (fotos, videos y YouTube). */
  items: SiteGalleryItem[];
  /** Configuración del modal de matrícula para el botón «Agendar una visita». */
  modalConfig?: AdmissionModalConfig;
  /** Dirección física oficial de la sede. */
  address?: string;
  /** Enlace a Google Maps. */
  mapsUrl?: string;
}

/**
 * Sección «Conoce nuestras instalaciones» (#instalaciones) para /about.
 * Server Component con alternancia de fondo blanco (SECTION_PLAIN)
 * entre el modelo solidario (gris) y el cierre (oscuro).
 */
export function FacilitiesGallery({
  intro,
  items,
  modalConfig,
  address,
  mapsUrl,
}: FacilitiesGalleryProps) {
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
        boton_visita: "Agendar una visita",
      };

  const title = textOr(intro?.title, "Conoce nuestras instalaciones");
  const description = textOr(intro?.description, "");
  const buttonText = meta.boton.trim();
  const buttonHref = meta.enlace.trim();
  const hasButton = Boolean(buttonText && buttonHref);

  const visitLabel = meta.boton_visita.trim();
  const hasVisit = Boolean(visitLabel && modalConfig);

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
            {address && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-700 dark:text-gray-200 pt-1">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <MapPin className="h-4 w-4 shrink-0 text-larioja-azul dark:text-larioja-amarillo" aria-hidden="true" />
                  <span>{address}</span>
                </span>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-larioja-azul dark:text-larioja-amarillo hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-larioja-azul dark:focus-visible:outline-larioja-amarillo"
                  >
                    Ver en Google Maps <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
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
          footerSlot={
            hasVisit && modalConfig ? (
              <FacilitiesVisitCta label={visitLabel} modalConfig={modalConfig} />
            ) : undefined
          }
        />
      </div>
    </section>
  );
}
