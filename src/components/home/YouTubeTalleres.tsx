"use client";

import Image from "next/image";
import { useState } from "react";

export const VIDEO_TALLERES_ID = "0rCP5NMMasY";

export interface YouTubeTalleresProps {
  videoUrl?: string;
  videoId?: string;
  titulo?: string;
  poster?: string;
  maxWidth?: number;
}

/**
 * Extrae el ID de 11 caracteres de un enlace de YouTube.
 */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.trim().match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
  );
  return match ? match[1] : null;
}

/**
 * Componente interactivo para incrustar videos verticales (9:16).
 * Carga el reproductor diferido de YouTube usando youtube-nocookie.com.
 * No realiza peticiones a YouTube hasta que el usuario pulsa Play (Zero-Cost LCP/CLS).
 *
 * @param {YouTubeTalleresProps} props Propiedades del reproductor
 * @returns {JSX.Element} Reproductor diferido optimizado
 */
export function YouTubeTalleres({
  videoUrl,
  videoId = VIDEO_TALLERES_ID,
  titulo = "Conoce los talleres del Centro de Formación Laboral La Rioja",
  poster = "/videos/talleres/miniatura-youtube-1280x720.jpg",
  maxWidth = 360,
}: YouTubeTalleresProps) {
  const [activo, setActivo] = useState(false);

  // Determinar si es YouTube (por defecto o si la URL contiene YouTube)
  const isYouTube =
    Boolean(videoId) ||
    !videoUrl ||
    videoUrl.includes("youtube") ||
    videoUrl.includes("youtu.be");

  const resolvedYtId =
    videoId || (videoUrl ? extractYouTubeId(videoUrl) : null) || VIDEO_TALLERES_ID;

  return (
    <div
      style={{ maxWidth: `${maxWidth}px` }}
      className="group relative w-full mx-auto aspect-[9/16] rounded-3xl overflow-hidden border border-slate-200/80 bg-slate-900 shadow-2xl dark:border-slate-800"
    >
      {activo ? (
        <>
          <button
            type="button"
            onClick={() => setActivo(false)}
            aria-label="Cerrar video y volver a portada"
            className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md transition-all hover:bg-black/90 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
              preload="auto"
              className="absolute inset-0 h-full w-full object-cover bg-black"
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
          className="relative h-full w-full cursor-pointer p-0 border-0 bg-transparent text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-larioja-amarillo focus-visible:ring-offset-2"
        >
          <Image
            src={poster}
            alt={titulo}
            fill
            sizes="(max-width: 640px) 100vw, 360px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={false}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/80 via-black/35 to-black/30 p-4 transition-colors group-hover:bg-black/30">
            {/* Botón flotante de play con anillo animado de atención */}
            <div className="relative flex h-18 w-18 items-center justify-center rounded-full bg-larioja-amarillo text-larioja-azul shadow-2xl transition-all duration-300 group-hover:scale-110 active:scale-95">
              <span className="pointer-events-none absolute -inset-2.5 rounded-full bg-yellow-400/40 animate-ping" />
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
              Ver video (4:18)
            </span>
          </div>
        </button>
      )}
    </div>
  );
}

export default YouTubeTalleres;
