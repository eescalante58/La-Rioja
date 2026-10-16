"use client";

import Image from "next/image";
import { useState } from "react";
import type { SiteContent } from "@/types/cms";

interface Props {
  video: SiteContent | null;
}

/**
 * Sección — Video institucional / Testimonio Audiovisual.
 * Muestra portada estática con botón animado de reproducción hasta que el usuario pulsa Play.
 * Solo se renderiza si metadata.visible === true en el CMS de Supabase.
 */
export function VideoSection({ video }: Props) {
  const [playing, setPlaying] = useState(false);
  const meta = (video?.metadata ?? {}) as Record<string, unknown>;

  if (!meta.visible) return null;

  const title = video?.title || "Un día en La Rioja";
  const description =
    video?.description ||
    "Conocé de cerca la alegría, el compromiso y las rutinas diarias de nuestros alumnos en los talleres.";
  const url = meta.url as string | undefined;
  const posterUrl = (meta.posterUrl as string) ?? "/nosotros/hero-estudiantes.webp";
  const subtitlesUrl = meta.subtitlesUrl as string | undefined;

  const isYoutube = url?.includes("youtube") || url?.includes("youtu.be");

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
                  alt="Portada del video institucional de La Rioja"
                  fill
                  sizes="(max-width: 1023px) 100vw, 768px"
                  className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/30">
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
                </div>
              </>
            )}

            {playing &&
              url &&
              (isYoutube ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={
                      url
                        .replace("watch?v=", "embed/")
                        .replace("youtu.be/", "www.youtube-nocookie.com/embed/") +
                      "?autoplay=1&rel=0"
                    }
                    title={title}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              ) : (
                <video className="aspect-video w-full" controls autoPlay playsInline>
                  <source src={url} />
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
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
