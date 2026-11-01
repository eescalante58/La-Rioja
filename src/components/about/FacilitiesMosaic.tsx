"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { GalleryThumb, buildGalleryThumbAriaLabel } from "./GalleryThumb";
import type { SiteGalleryItem } from "@/types/cms";

const FacilitiesLightbox = dynamic(() => import("./FacilitiesLightbox"), {
  ssr: false,
});

interface FacilitiesMosaicProps {
  items: SiteGalleryItem[];
  visibleCount: number;
  showCaptions: boolean;
  /** Slot opcional para acciones adicionales en el pie (ej. botón «Agendar una visita»). */
  footerSlot?: React.ReactNode;
}

export function FacilitiesMosaic({
  items,
  visibleCount,
  showCaptions,
  footerSlot,
}: FacilitiesMosaicProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const triggerButtonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const lastTriggerElRef = useRef<HTMLButtonElement | null>(null);

  const total = items.length;
  const countToShow = Math.min(visibleCount, total);

  // Abrir lightbox guardando referencia al botón para devolver el foco accesible al cerrar
  const handleOpen = (index: number, triggerEl?: HTMLButtonElement | null) => {
    lastTriggerElRef.current = triggerEl || triggerButtonRefs.current.get(index) || null;
    setOpenIndex(index);
  };

  const handleClose = () => {
    const triggerEl = lastTriggerElRef.current;
    const idx = openIndex;
    setOpenIndex(null);
    setTimeout(() => {
      if (triggerEl) {
        triggerEl.focus();
      } else if (idx !== null && triggerButtonRefs.current.has(idx)) {
        triggerButtonRefs.current.get(idx)?.focus();
      }
    }, 50);
  };

  // Cálculo del índice visible en el carrusel móvil mediante scroll pasivo
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const handleScroll = () => {
      const firstChild = el.firstElementChild as HTMLElement | null;
      if (!firstChild) return;
      const cardWidth = firstChild.getBoundingClientRect().width + 12; // gap
      const current = Math.round(el.scrollLeft / cardWidth);
      setCarouselIndex(Math.max(0, Math.min(total - 1, current)));
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [total]);

  if (total === 0) return null;

  return (
    <div className="space-y-4">
      {/* ========================================================= */}
      {/* 1. VISTA ESCRITORIO Y TABLETA (>= 640px)                  */}
      {/* ========================================================= */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.slice(0, countToShow).map((item, idx) => {
          const isFirst = idx === 0;
          const isLastWithMore = idx === countToShow - 1 && total > countToShow;
          const remainingCount = isLastWithMore ? total - countToShow + 1 : 0;
          const ariaLabel = buildGalleryThumbAriaLabel(item, idx, total, isLastWithMore);

          return (
            <button
              key={item.id}
              ref={(node) => {
                if (node) triggerButtonRefs.current.set(idx, node);
                else triggerButtonRefs.current.delete(idx);
              }}
              type="button"
              onClick={(e) => handleOpen(idx, e.currentTarget)}
              aria-label={ariaLabel}
              className={`group relative overflow-hidden rounded-[18px] bg-gray-100 dark:bg-gray-900 border-0 p-0 text-left cursor-pointer transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul-enlace dark:focus-visible:outline-larioja-amarillo shadow-sm hover:shadow-md ${
                isFirst
                  ? "col-span-2 row-span-2 aspect-[16/9] lg:aspect-auto"
                  : "aspect-[16/10]"
              }`}
            >
              <GalleryThumb
                item={item}
                sizes={
                  isFirst
                    ? "(min-width: 1024px) 620px, 100vw"
                    : "(min-width: 1024px) 300px, 50vw"
                }
                showCaption={showCaptions}
                captionClassName={`font-montserrat font-bold ${
                  isFirst ? "text-base sm:text-lg" : "text-sm sm:text-[15px]"
                }`}
                showExpandIcon={true}
                remainingCount={remainingCount}
              />
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 2. VISTA CELULAR (< 640px): CARRUSEL HORIZONTAL           */}
      {/* ========================================================= */}
      <div className="sm:hidden space-y-3">
        <div
          ref={carouselRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 -mx-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, idx) => (
            <button
              key={item.id}
              ref={(node) => {
                if (node) triggerButtonRefs.current.set(idx, node);
              }}
              type="button"
              onClick={(e) => handleOpen(idx, e.currentTarget)}
              aria-label={buildGalleryThumbAriaLabel(item, idx, total, false)}
              className="group relative flex-shrink-0 basis-[85%] snap-center aspect-[16/10] overflow-hidden rounded-[18px] bg-gray-100 dark:bg-gray-900 border-0 p-0 text-left shadow-md cursor-pointer"
            >
              <GalleryThumb
                item={item}
                sizes="85vw"
                showCaption={showCaptions}
                captionClassName="font-montserrat font-bold text-sm"
                showExpandIcon={false}
              />
            </button>
          ))}
        </div>

        {/* Contador móvil y puntos de navegación */}
        <div className="flex items-center justify-between pt-1">
          <span
            className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-larioja-azul dark:text-larioja-amarillo font-montserrat font-bold text-xs"
            aria-live="polite"
          >
            {carouselIndex + 1} / {total}
          </span>

          <div className="flex items-center gap-1.5" aria-hidden="true">
            {items.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === carouselIndex
                    ? "w-6 bg-larioja-azul dark:bg-larioja-amarillo"
                    : "w-2 bg-gray-300 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Pie de sección: botón accesible para abrir galería completa + CTA opcional */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6">
        <button
          type="button"
          onClick={(e) => handleOpen(0, e.currentTarget)}
          className="inline-flex items-center justify-center sm:justify-start gap-1.5 font-montserrat font-bold text-[15px] text-larioja-azul-enlace dark:text-larioja-amarillo hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-larioja-azul-enlace dark:focus-visible:outline-larioja-amarillo min-h-[44px] sm:min-h-[52px] cursor-pointer"
        >
          Ver galería completa ({total})
          <ArrowRight size={16} aria-hidden="true" />
        </button>
        {footerSlot}
      </div>

      {/* Visor modal accesible (cargado de forma diferida) */}
      {openIndex !== null && (
        <FacilitiesLightbox
          items={items}
          initialIndex={openIndex}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
