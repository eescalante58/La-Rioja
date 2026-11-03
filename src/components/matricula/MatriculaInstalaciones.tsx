"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Expand } from "lucide-react";
import { BTN_YELLOW, EYEBROW, SECTION_ANCHOR } from "@/components/site/section-ui";
import { GalleryThumb, buildGalleryThumbAriaLabel } from "@/components/about/GalleryThumb";
import { matriculaInstalacionesMetaSchema } from "@/lib/validation/matricula";
import type { SiteContent, SiteGalleryItem } from "@/types/cms";

const FacilitiesLightbox = dynamic(() => import("@/components/about/FacilitiesLightbox"), {
  ssr: false,
});

interface MatriculaInstalacionesProps {
  /** Fila `matricula_instalaciones` (textos y botón). */
  section: SiteContent | null;
  /** Elementos activos de la galería `cl_instalaciones` (fuente única con /about). */
  items: SiteGalleryItem[];
  /** Si la sección #instalaciones de /about está activa (muestra el enlace secundario). */
  aboutActive: boolean;
}

/**
 * Bloque «Conoce nuestras instalaciones» (#instalaciones) en /matricula.
 * Muestra vista previa de hasta 4 elementos de la galería de Quiénes Somos y abre
 * el visor modal ahí mismo sin salir de la página.
 */
export function MatriculaInstalaciones({
  section,
  items,
  aboutActive,
}: MatriculaInstalacionesProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const lastTriggerElRef = useRef<HTMLButtonElement | null>(null);

  if (!section || !section.is_active || items.length === 0) {
    return null;
  }

  const parsedMeta = matriculaInstalacionesMetaSchema.safeParse(section.metadata || {});
  const meta = parsedMeta.success
    ? parsedMeta.data
    : {
        antetitulo: "Instalaciones",
        boton: "Ver instalaciones",
        enlace_texto: "Ver la sección completa en Quiénes Somos",
        enlace: "/about#instalaciones",
        fotos: 4 as const,
      };

  const title = section.title?.trim() || "Conoce nuestras instalaciones";
  const description =
    section.description?.trim() ||
    "Antes de tu visita, recorre los espacios donde tu familiar aprenderá, compartirá y se formará cada día.";
  const eyebrow = meta.antetitulo.trim() || "Instalaciones";
  const buttonLabel = meta.boton.trim() || "Ver instalaciones";
  const linkText = meta.enlace_texto.trim();
  const linkHref = meta.enlace.trim() || "/about#instalaciones";
  const showSecondaryLink = Boolean(aboutActive && linkText);

  const total = items.length;
  const maxPreview = 4;
  const previewItems = items.slice(0, maxPreview);

  const handleOpen = (index: number, triggerEl: HTMLButtonElement) => {
    lastTriggerElRef.current = triggerEl;
    setOpenIndex(index);
  };

  const handleClose = () => {
    const triggerEl = lastTriggerElRef.current;
    setOpenIndex(null);
    if (triggerEl) {
      requestAnimationFrame(() => {
        triggerEl.focus();
      });
    }
  };

  return (
    <section
      id="instalaciones"
      aria-labelledby="matricula-instalaciones-titulo"
      className={`bg-white dark:bg-gray-950 py-16 sm:py-20 ${SECTION_ANCHOR}`}
    >
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-larioja-azul dark:bg-larioja-azul-profundo dark:border dark:border-white/10 text-white p-7 sm:p-10 lg:p-12 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Círculo decorativo superior derecho */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />

          {/* Columna de texto y acciones */}
          <div className="relative lg:col-span-5">
            {eyebrow && <p className={EYEBROW}>{eyebrow}</p>}

            <h2
              id="matricula-instalaciones-titulo"
              className="mt-2.5 mb-3 font-montserrat font-extrabold text-[clamp(28px,3.2vw,40px)] leading-[1.12] text-white"
            >
              {title}
            </h2>

            {description && (
              <p className="m-0 mb-6 text-base sm:text-[17px] leading-relaxed text-white/90">
                {description}
              </p>
            )}

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-x-6 sm:gap-y-3">
              <button
                type="button"
                onClick={(e) => handleOpen(0, e.currentTarget)}
                className={`${BTN_YELLOW} rounded-full w-full sm:w-auto cursor-pointer focus-visible:outline-larioja-amarillo`}
              >
                <span>
                  {buttonLabel} ({total})
                </span>
                <Expand size={18} aria-hidden="true" />
              </button>

              {showSecondaryLink && (
                <Link
                  href={linkHref}
                  className="inline-flex min-h-[44px] items-center justify-center sm:justify-start gap-1.5 font-montserrat text-[15px] font-bold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-larioja-amarillo"
                >
                  <span>{linkText}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          </div>

          {/* Columna de miniaturas (2x2) */}
          <div className="relative lg:col-span-7 grid grid-cols-2 gap-3 sm:gap-3.5">
            {previewItems.map((item, idx) => {
              const isLastWithMore = idx === maxPreview - 1 && total > maxPreview;
              const remainingCount = isLastWithMore ? total - maxPreview + 1 : 0;
              const isSingle = previewItems.length === 1;
              const ariaLabel = buildGalleryThumbAriaLabel(
                item,
                idx,
                total,
                isLastWithMore,
              );

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => handleOpen(idx, e.currentTarget)}
                  aria-label={ariaLabel}
                  className={`group relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#1e2a4a] border-0 p-0 text-left cursor-pointer transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-amarillo shadow-md ${
                    isSingle ? "col-span-2" : ""
                  }`}
                >
                  <GalleryThumb
                    item={item}
                    sizes="(min-width: 1024px) 340px, 45vw"
                    showCaption={true}
                    captionClassName="font-inter font-semibold text-xs sm:text-[13px]"
                    showExpandIcon={false}
                    remainingCount={remainingCount}
                    moreCountClassName="font-montserrat font-extrabold text-[26px] text-larioja-amarillo leading-none"
                    moreLabelClassName="font-inter font-semibold text-[13px] text-white mt-1"
                    moreOverlayClassName="bg-larioja-azul-profundo/80"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visor modal accesible en la misma página */}
      {openIndex !== null && (
        <FacilitiesLightbox
          items={items}
          initialIndex={openIndex}
          onClose={handleClose}
        />
      )}
    </section>
  );
}
