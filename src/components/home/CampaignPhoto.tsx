"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Expand, ExternalLink, X } from "lucide-react";

export interface CampaignPhotoProps {
  src: string;
  alt: string;
  tag: string;
  href: string;
  title?: string;
  linkLabel?: string;
  /** "auto" detecta según dimensiones reales; "contain" fuerza modo afiche; "cover" fuerza foto horizontal. */
  imageFit?: "auto" | "contain" | "cover";
}

/**
 * Bloque de imagen de una campaña (`cl_campaign_1..3`).
 * - Si la imagen es horizontal (`width > height`), se muestra a sangre (`object-cover`).
 * - Si la imagen es un afiche vertical o cuadrado (`height >= width * 0.92`) o se configura `imageFit="contain"`,
 *   se muestra íntegra (`object-contain`) sobre un fondo desenfocado sin recortar textos ni bordes,
 *   y permite abrir el afiche completo en un visor modal accesible.
 */
export function CampaignPhoto({
  src,
  alt,
  tag,
  href,
  title,
  linkLabel,
  imageFit = "auto",
}: CampaignPhotoProps) {
  const [detectedPoster, setDetectedPoster] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const isPoster =
    imageFit === "contain" ? true : imageFit === "cover" ? false : detectedPoster;
  const isExternal = /^https?:\/\//i.test(href);
  const hasRealHref = Boolean(href && href !== "#");

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  const handleImageLoad = (img: HTMLImageElement) => {
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setDetectedPoster(img.naturalHeight >= img.naturalWidth * 0.92);
    }
  };

  return (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
        {isPoster || !hasRealHref ? (
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="group/photo relative block h-full w-full cursor-zoom-in text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-amarillo"
            aria-label={`Ampliar afiche: ${alt}`}
          >
            {/* Fondo atmosférico desenfocado para rellenar los laterales del afiche vertical */}
            <Image
              src={src}
              alt=""
              fill
               aria-hidden="true"
              sizes="(max-width: 767px) 100vw, 33vw"
              className="scale-110 object-cover opacity-40 blur-xl"
            />
            <div className="absolute inset-0 bg-slate-950/35" />

            {/* Afiche completo sin recortar */}
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 767px) 100vw, 33vw"
              onLoad={(e) => handleImageLoad(e.currentTarget)}
              className="object-contain p-1.5 transition-transform duration-500 group-hover/photo:scale-[1.03]"
            />

            {/* Indicador de ampliación */}
            <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs transition-colors group-hover/photo:bg-larioja-azul">
              <Expand className="h-3 w-3" aria-hidden="true" />
              Ver afiche
            </span>
          </button>
        ) : (
          <Link
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="relative block h-full w-full"
            aria-label={`Ir a la campaña: ${alt}`}
          >
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 767px) 100vw, 33vw"
              onLoad={(e) => handleImageLoad(e.currentTarget)}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </Link>
        )}

        {/* Etiqueta de campaña */}
        {tag && (
          <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-larioja-amarillo px-3 py-0.5 text-[11px] font-extrabold text-larioja-azul shadow-xs">
            {tag}
          </span>
        )}

        {/* Botón rápido de ampliación también disponible en fotos horizontales */}
        {!isPoster && hasRealHref && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            className="absolute right-2.5 top-2.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-xs transition-opacity hover:bg-black/80 focus-visible:opacity-100 group-hover:opacity-100"
            aria-label={`Ver imagen completa: ${alt}`}
            title="Ver imagen completa"
          >
            <Expand className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Visor modal accesible para leer afiches verticales o ver fotos a tamaño completo */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title || alt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-slate-950 shadow-2xl ring-1 ring-white/15"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
              <div className="flex items-center gap-2 truncate pr-3">
                {tag && (
                  <span className="shrink-0 rounded-full bg-larioja-amarillo px-2.5 py-0.5 text-[11px] font-extrabold text-larioja-azul">
                    {tag}
                  </span>
                )}
                <span className="truncate font-montserrat text-sm font-bold">
                  {title || alt}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-amarillo"
                aria-label="Cerrar vista ampliada"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="relative flex min-h-[55vh] max-h-[75vh] w-full items-center justify-center bg-slate-900 p-2 sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                className="max-h-[71vh] w-auto max-w-full rounded-lg object-contain shadow-lg"
              />
            </div>

            {hasRealHref && linkLabel && (
              <div className="flex items-center justify-end border-t border-white/10 bg-slate-950 px-4 py-3">
                <Link
                  href={href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  onClick={() => setIsLightboxOpen(false)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-larioja-amarillo px-5 py-2 text-xs font-extrabold text-larioja-azul transition-transform hover:scale-[1.02]"
                >
                  {linkLabel}
                  {isExternal ? (
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">→</span>
                  )}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
