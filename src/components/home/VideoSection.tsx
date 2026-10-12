"use client";

import Image from "next/image";
import { useState } from "react";
import type { SiteContent } from "@/types/cms";

interface Props {
  video: SiteContent | null;
}

/**
 * Sección 6 — Video institucional.
 * Muestra portada estática hasta que el usuario pulsa Play.
 * Solo se renderiza si metadata.visible === true.
 */
export function VideoSection({ video }: Props) {
  const [playing, setPlaying] = useState(false);
  const meta = (video?.metadata ?? {}) as Record<string, unknown>;

  if (!meta.visible) return null;

  const url = meta.url as string | undefined;
  const posterUrl = (meta.posterUrl as string) ?? "/nosotros/hero-estudiantes.webp";
  const subtitlesUrl = meta.subtitlesUrl as string | undefined;

  const isYoutube = url?.includes("youtube") || url?.includes("youtu.be");

  return (
    <section className="bg-larioja-azul py-16 lg:py-20" aria-label="Video institucional">
      <div className="mx-auto max-w-screen-xl px-4 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-center font-montserrat text-2xl font-extrabold text-white lg:text-3xl">
            Un día en La Rioja
          </h2>

          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            {!playing && (
              <>
                <div className="relative aspect-video">
                  <Image
                    src={posterUrl}
                    alt="Portada del video institucional de La Rioja"
                    fill
                    sizes="(max-width: 1023px) 100vw, 768px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30" />
                </div>
                <button
                  onClick={() => setPlaying(true)}
                  aria-label="Reproducir el video Un día en La Rioja"
                  className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-larioja-amarillo text-larioja-azul shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-amarillo focus-visible:ring-offset-2"
                >
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
              </>
            )}

            {playing &&
              url &&
              (isYoutube ? (
                <div className="aspect-video">
                  <iframe
                    src={
                      url
                        .replace("watch?v=", "embed/")
                        .replace("youtu.be/", "www.youtube-nocookie.com/embed/") +
                      "?autoplay=1&rel=0"
                    }
                    title="Un día en La Rioja"
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
