import React from "react";
import Image from "next/image";
import { Play, Expand } from "lucide-react";
import { formatDuration } from "@/lib/video-url";
import type { SiteGalleryItem } from "@/types/cms";

export const GALLERY_BLUR_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8wNPvd7POQAAAABJRU5ErkJggg==";

/**
 * Resuelve la URL de vista previa de un elemento de galería (foto, video o YouTube).
 */
export function resolveGalleryThumbUrl(item: SiteGalleryItem): string {
  if (item.poster_url) return item.poster_url;
  if (item.media_type === "youtube" && item.youtube_id) {
    return `https://i.ytimg.com/vi/${item.youtube_id}/hqdefault.jpg`;
  }
  return item.media_url;
}

/**
 * Construye la etiqueta accesible (aria-label) para una miniatura de galería.
 */
export function buildGalleryThumbAriaLabel(
  item: SiteGalleryItem,
  index: number,
  total: number,
  isLastWithMore = false,
): string {
  if (isLastWithMore) {
    return `Ver las ${total} fotos y videos de la galería de instalaciones`;
  }
  const isVideo = item.media_type === "video" || item.media_type === "youtube";
  const label = item.caption || item.alt_text;
  return isVideo
    ? `Ver video: ${label} (${index + 1} de ${total})`
    : `Ver foto: ${label} (${index + 1} de ${total})`;
}

interface GalleryThumbProps {
  item: SiteGalleryItem;
  sizes: string;
  showCaption?: boolean;
  captionClassName?: string;
  showExpandIcon?: boolean;
  remainingCount?: number;
  moreCountClassName?: string;
  moreLabelClassName?: string;
  moreOverlayClassName?: string;
}

/**
 * Contenido visual interno de una miniatura interactiva de galería:
 * imagen con efecto zoom, distintivo de video/YouTube, leyenda en degradado y capa «+N · Ver todas».
 */
export function GalleryThumb({
  item,
  sizes,
  showCaption = true,
  captionClassName = "font-montserrat font-bold text-sm sm:text-[15px]",
  showExpandIcon = true,
  remainingCount = 0,
  moreCountClassName = "font-montserrat font-extrabold text-3xl sm:text-4xl text-larioja-amarillo",
  moreLabelClassName = "font-montserrat font-bold text-sm sm:text-base mt-1 text-white",
  moreOverlayClassName = "bg-larioja-azul/85 dark:bg-larioja-azul-profundo/90 backdrop-blur-[2px]",
}: GalleryThumbProps) {
  const isVideo = item.media_type === "video";
  const isYouTube = item.media_type === "youtube";
  const isLastWithMore = remainingCount > 0;
  const thumbSrc = resolveGalleryThumbUrl(item);

  return (
    <>
      {/* Imagen de fondo / portada */}
      <div className="relative w-full h-full">
        <Image
          src={thumbSrc}
          alt=""
          fill
          sizes={sizes}
          loading="lazy"
          placeholder="blur"
          blurDataURL={GALLERY_BLUR_PLACEHOLDER}
          className="object-cover transform group-hover:scale-[1.04] transition-transform duration-500 motion-reduce:transform-none"
        />
      </div>

      {/* Distintivo de video con botón Play centrado */}
      {(isVideo || isYouTube) && !isLastWithMore && (
        <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/95 dark:bg-gray-900/95 text-larioja-azul dark:text-larioja-amarillo flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Play size={22} className="ml-0.5" fill="currentColor" />
        </div>
      )}

      {/* Insignia de duración en video */}
      {isVideo && item.duration_seconds && !isLastWithMore && (
        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 text-white text-[11px] font-bold font-mono backdrop-blur-sm">
          {formatDuration(item.duration_seconds)}
        </span>
      )}

      {isYouTube && !isLastWithMore && (
        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-bold font-montserrat backdrop-blur-sm">
          YouTube
        </span>
      )}

      {/* Ícono de zoom sutil al pasar cursor */}
      {showExpandIcon && !isLastWithMore && !isVideo && !isYouTube && (
        <span
          aria-hidden="true"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-larioja-azul flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
        >
          <Expand size={15} />
        </span>
      )}

      {/* Leyenda sobre degradado oscuro */}
      {showCaption && item.caption && !isLastWithMore && (
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 pt-8 sm:pt-10 bg-gradient-to-t from-[#0A0C14]/85 via-[#0A0C14]/40 to-transparent">
          <p className={`m-0 text-white leading-snug drop-shadow-sm text-left ${captionClassName}`}>
            {item.caption}
          </p>
        </div>
      )}

      {/* Capa de «+N / Ver todas» en la última casilla cuando hay excedente */}
      {isLastWithMore && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center ${moreOverlayClassName}`}
        >
          <span className={moreCountClassName}>+{remainingCount}</span>
          <span className={moreLabelClassName}>Ver todas</span>
        </div>
      )}
    </>
  );
}
