"use client";

import Image from "next/image";
import { useState } from "react";
import type { SiteContent } from "@/types/cms";

interface Props {
  video: SiteContent | null;
}

type VideoSourceType = "youtube" | "vimeo" | "native" | "none";

interface ParsedVideo {
  type: VideoSourceType;
  embedUrl?: string;
  nativeUrl?: string;
}

/**
 * Extrae y normaliza el origen del video para reproducción embebida o HTML5.
 * Admite enlaces de YouTube (estándar, shorts, youtu.be, embed), Vimeo y archivos directos (mp4/webm/supabase).
 */
function parseVideoSource(rawUrl: string): ParsedVideo {
  if (!rawUrl || !rawUrl.trim()) {
    return { type: "none" };
  }

  const trimmed = rawUrl.trim();

  // YouTube match: formatos estándar watch, shorts, youtu.be, embed
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`,
    };
  }

  // Vimeo match
  const vimeoMatch = trimmed.match(
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/,
  );
  if (vimeoMatch && (vimeoMatch[3] || vimeoMatch[2])) {
    const vimeoId = vimeoMatch[3] || vimeoMatch[2];
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
    };
  }

  // Video HTML5 directo
  return {
    type: "native",
    nativeUrl: trimmed.includes("#t=") ? trimmed : `${trimmed}#t=0.5`,
  };
}

/**
 * Sección — Video institucional / Testimonio Audiovisual (cl_video).
 * Muestra portada estática con botón animado de reproducción hasta que el usuario pulsa Play.
 * Compatible con YouTube, Vimeo, y videos directos (MP4/WebM/Supabase Storage) vía metadata o image_url.
 */
export function VideoSection({ video }: Props) {
  const [playing, setPlaying] = useState(false);
  const meta = (video?.metadata ?? {}) as Record<string, unknown>;

  // No renderizar si no existe el registro o si explícitamente se configuró como no visible
  if (!video || meta.visible === false) return null;

  const title = video.title || "Un día en La Rioja";
  const description =
    video.description ||
    "Conocé de cerca la alegría, el compromiso y las rutinas diarias de nuestros alumnos en los talleres.";

  // Resolución de URL: revisa metadata (url / video_url) o la columna image_url del CMS
  const rawUrl =
    (typeof meta.url === "string" && meta.url.trim()) ||
    (typeof meta.video_url === "string" && meta.video_url.trim()) ||
    (typeof video.image_url === "string" && video.image_url.trim()) ||
    "";

  // Resolución segura del póster para evitar errores con cadenas vacías "" en Next Image
  const posterCandidate =
    (typeof meta.posterUrl === "string" && meta.posterUrl.trim()) ||
    (typeof meta.poster === "string" && meta.poster.trim()) ||
    (typeof meta.foto === "string" && meta.foto.trim()) ||
    "";
  const posterUrl = posterCandidate || "/nosotros/hero-estudiantes.webp";

  const subtitlesUrl =
    typeof meta.subtitlesUrl === "string" && meta.subtitlesUrl.trim()
      ? meta.subtitlesUrl.trim()
      : undefined;

  const parsed = parseVideoSource(rawUrl);
  const hasVideo = parsed.type !== "none";

  return (
    <section
      id="seccion-video"
      className="border-y border-slate-200/60 bg-slate-50 py-14 dark:border-slate-800 dark:bg-slate-900/50 lg:py-20"
      aria-labelledby="video-heading"
    >
      <div className="mx-auto max-w-screen-xl px-4 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-larioja-azul dark:text-sky-400">
            <span aria-hidden="true">🎥</span> Testimonio Audiovisual
          </div>
          <h2
            id="video-heading"
            className="font-montserrat text-xl font-extrabold text-larioja-azul dark:text-larioja-amarillo sm:text-2xl lg:text-3xl"
          >
            {title}
          </h2>
          <p className="mx-auto mb-6 mt-1.5 max-w-lg text-xs text-ink-muted dark:text-slate-400 sm:text-sm">
            {description}
          </p>

          <div className="group relative aspect-video overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-xl dark:border-slate-800">
            {!playing && (
              <>
                <Image
                  src={posterUrl}
                  alt={`Portada del video institucional: ${title}`}
                  fill
                  sizes="(max-width: 1023px) 100vw, 896px"
                  className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                  priority={false}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/70 via-black/40 to-black/30 p-4 transition-colors group-hover:bg-black/35">
                  {hasVideo ? (
                    <button
                      onClick={() => setPlaying(true)}
                      aria-label={`Reproducir video: ${title}`}
                      className="relative flex h-16 w-16 items-center justify-center rounded-full bg-larioja-amarillo text-larioja-azul shadow-2xl transition-all hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-amarillo focus-visible:ring-offset-2"
                    >
                      {/* Anillo animado de atención */}
                      <span className="pointer-events-none absolute -inset-2 rounded-full bg-yellow-400/40 animate-ping" />
                      {/* Ícono play */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="ml-1 h-7 w-7"
                        aria-hidden="true"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
                      <span className="h-2 w-2 rounded-full bg-larioja-amarillo animate-pulse" />
                      Video en producción · Próximamente disponible
                    </div>
                  )}
                </div>
              </>
            )}

            {playing && hasVideo && (
              <div className="relative h-full w-full">
                {/* Botón para cerrar o volver a la portada */}
                <button
                  type="button"
                  onClick={() => setPlaying(false)}
                  aria-label="Cerrar video y volver a portada"
                  className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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

                {parsed.type === "youtube" || parsed.type === "vimeo" ? (
                  <iframe
                    src={parsed.embedUrl}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                ) : (
                  <video
                    className="h-full w-full object-contain bg-black"
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                  >
                    <source src={parsed.nativeUrl} />
                    {subtitlesUrl && (
                      <track
                        kind="captions"
                        src={subtitlesUrl}
                        srcLang="es"
                        label="Español"
                        default
                      />
                    )}
                    Tu navegador no soporta la reproducción de video.
                  </video>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
