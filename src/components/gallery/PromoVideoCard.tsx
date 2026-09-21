"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

interface PromoVideoCardProps {
  videoUrl: string;
  title?: string;
  subtitle?: string;
  logoUrl?: string;
}

/**
 * Tarjeta de video promocional con estilo de "embed" de portal de noticias:
 * fondo azul degradado, logo circular, título, subtítulo y el reproductor
 * centrado con un botón de play superpuesto hasta la primera reproducción.
 */
export default function PromoVideoCard({
  videoUrl,
  title,
  subtitle,
  logoUrl = "/logo.png",
}: PromoVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  /**
   * Inicia la reproducción y habilita los controles nativos del video.
   */
  const handlePlay = async () => {
    try {
      await videoRef.current?.play();
      setStarted(true);
    } catch {
      // El navegador puede bloquear el autoplay; el usuario usará los controles
      setStarted(true);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b from-larioja-azul via-blue-800 to-blue-950 p-4 shadow-2xl ring-1 ring-white/10">
      {/* Encabezado estilo noticia: avatar circular + título + fuente */}
      <div className="flex items-center gap-3 px-1 pb-4">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white shadow-md">
          <Image
            src={logoUrl}
            alt="La Rioja"
            fill
            sizes="44px"
            className="object-contain p-1"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate font-montserrat text-sm font-black uppercase tracking-wide text-white">
            {title || "Video promocional"}
          </p>
          <p className="truncate text-xs font-medium text-white/70">
            {subtitle || "Bingo La Rioja"}
          </p>
        </div>
      </div>

      {/* Reproductor con overlay de play */}
      <div className="relative overflow-hidden rounded-2xl bg-black/70">
        <video
          ref={videoRef}
          src={videoUrl}
          controls={started}
          playsInline
          preload="metadata"
          className="mx-auto max-h-[70vh] w-full"
        />
        {!started && (
          <button
            type="button"
            onClick={handlePlay}
            aria-label="Reproducir video promocional"
            className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors hover:bg-black/40"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-xl transition-transform hover:scale-110">
              <Play className="ml-1 h-8 w-8 fill-white text-white" />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
