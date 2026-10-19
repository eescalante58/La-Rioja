"use client";

import Image from "next/image";
import { useState } from "react";

export const VIDEO_TALLERES_ID = "0rCP5NMMasY";

export type VideoAspectRatio = "9:16" | "16:9";

export interface YouTubeTalleresProps {
  /** URL directa de video (.mp4 en Supabase Storage / ruta local) o enlace de YouTube. */
  videoUrl?: string;
  /** ID de 11 caracteres de YouTube (opcional si se pasa `videoUrl`). */
  videoId?: string;
  /** Título accesible del video. */
  titulo?: string;
  /** URL de la imagen de portada antes de reproducir. */
  poster?: string;
  /** Ancho máximo en píxeles del contenedor. */
  maxWidth?: number;
  /** Proporción de aspecto del reproductor: vertical ("9:16") u horizontal ("16:9"). */
  aspect?: VideoAspectRatio;
  /** Duración opcional para mostrar en el botón (ej. "1:30" o "4:18"). */
  duracion?: string;
}

/**
 * Extrae el ID de 11 caracteres de un enlace de YouTube.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.trim().match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
  );
  return match ? match[1] : null;
}

/**
 * Determina si una URL apunta a un archivo de video directo (Supabase Storage o ruta local).
 */
export function isDirectVideoUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.trim().split("?")[0].toLowerCase();
  return (
    clean.endsWith(".mp4") ||
    clean.endsWith(".webm") ||
    clean.endsWith(".mov") ||
    clean.includes("/storage/v1/object/public/")
  );
}

/**
 * Componente interactivo para incrustar videos institucionales tanto desde
 * YouTube (`youtube-nocookie.com`) como desde Supabase Storage (`.mp4`),
 * soportando formato vertical (`9:16`) y horizontal (`16:9`).
 */
export function YouTubeTalleres({
  videoUrl,
  videoId,
  titulo = "Conoce los talleres del Centro de Formación Laboral La Rioja",
  poster = "/videos/talleres/miniatura-youtube-1280x720.jpg",
  maxWidth,
  aspect = "9:16",
  duracion,
}: YouTubeTalleresProps) {
  const [activo, setActivo] = useState(false);
  const [detectedAspect, setDetectedAspect] = useState<VideoAspectRatio | null>(null);

  const ytFromUrl = videoUrl ? extractYouTubeId(videoUrl) : null;
  const directVideo = Boolean(videoUrl && isDirectVideoUrl(videoUrl) && !ytFromUrl);
  const isYouTube = !directVideo;

  const resolvedYtId = ytFromUrl || videoId || VIDEO_TALLERES_ID;
  const effectiveAspect: VideoAspectRatio = detectedAspect ?? aspect;
  const isHorizontal = effectiveAspect === "16:9";
  const resolvedMaxWidth = maxWidth ?? (isHorizontal ? 680 : 360);

  const resolvedPoster =
    poster ||
    (isYouTube
      ? `https://i.ytimg.com/vi/${resolvedYtId}/hqdefault.jpg`
      : "/videos/talleres/miniatura-youtube-1280x720.jpg");

  const ctaLabel = duracion ? `Ver video (${duracion})` : "Ver video";

  return (
    <div
      style={{ maxWidth: `${resolvedMaxWidth}px` }}
      className={`group relative mx-auto w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 shadow-2xl dark:border-slate-800 ${
        isHorizontal ? "aspect-video" : "aspect-[9/16]"
      }`}
    >
      {activo ? (
        <>
          <button
            type="button"
            onClick={() => setActivo(false)}
            aria-label="Cerrar video y volver a portada"
            className="absolute right-3 top-3 z-20 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {isYouTube ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${resolvedYtId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            <video
              controls
              autoPlay
              playsInline
              preload="metadata"
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth > 0 && v.videoHeight > 0) {
                  setDetectedAspect(v.videoWidth >= v.videoHeight ? "16:9" : "9:16");
                }
              }}
              className="absolute inset-0 h-full w-full bg-black object-contain"
            >
              <source src={videoUrl} type="video/mp4" />
              Tu navegador no soporta la reproducción de video.
            </video>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={() => setActivo(true)}
          aria-label={`Reproducir video: ${titulo}`}
          className="relative h-full w-full cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-larioja-amarillo focus-visible:ring-offset-2"
        >
          <Image
            src={resolvedPoster}
            alt={titulo}
            fill
            sizes={
              isHorizontal
                ? "(max-width: 1024px) 100vw, 680px"
                : "(max-width: 640px) 100vw, 360px"
            }
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={false}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/80 via-black/35 to-black/30 p-4 transition-colors group-hover:bg-black/30">
            {/* Botón flotante de play con anillo animado de atención */}
            <div className="relative flex h-18 w-18 items-center justify-center rounded-full bg-larioja-amarillo text-larioja-azul shadow-2xl transition-all duration-300 group-hover:scale-110 active:scale-95">
              <span className="pointer-events-none absolute -inset-2.5 animate-ping rounded-full bg-yellow-400/40" />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="ml-1 h-8 w-8"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>

            <span className="mt-4 rounded-full bg-black/60 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
              {ctaLabel}
            </span>
          </div>
        </button>
      )}
    </div>
  );
}

export default YouTubeTalleres;
