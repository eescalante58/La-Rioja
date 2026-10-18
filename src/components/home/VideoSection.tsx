"use client";

import Link from "next/link";
import type { SiteContent } from "@/types/cms";
import { YouTubeTalleres, VIDEO_TALLERES_ID } from "./YouTubeTalleres";

interface Props {
  video: SiteContent | null;
}

/**
 * Extrae el ID de 11 caracteres de un enlace de YouTube.
 */
function extractYouTubeId(rawUrl: string): string | null {
  if (!rawUrl) return null;
  const match = rawUrl.trim().match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
  );
  return match ? match[1] : null;
}

/**
 * Sección — Video institucional / Testimonio Audiovisual (cl_video).
 * En móvil (<640px): diseño centrado de una columna con ancho máximo 360px.
 * En tablet y escritorio (≥768px): dos columnas con texto de contexto a un lado y video vertical 9:16 al otro.
 * Carga diferida zero-cost: sin llamadas a dominios externos hasta pulsar Play.
 */
export function VideoSection({ video }: Props) {
  const meta = (video?.metadata ?? {}) as Record<string, unknown>;

  // No renderizar si no existe el registro o si explícitamente se configuró como invisible
  if (!video || meta.visible === false) return null;

  const title =
    video.title || "Conoce los talleres del Centro de Formación Laboral La Rioja";
  const contextSubtitle =
    (typeof meta.subtitulo === "string" && meta.subtitulo.trim()) ||
    "Así aprenden y crean nuestros jóvenes";
  const description =
    video.description ||
    "Acompaña a nuestros estudiantes en un día de clases y talleres. Descubre el compromiso, la alegría y las habilidades productivas que desarrollan cada día.";

  // Resolución de URL del video
  const rawUrl =
    (typeof meta.url === "string" && meta.url.trim()) ||
    (typeof meta.video_url === "string" && meta.video_url.trim()) ||
    (typeof video.image_url === "string" && video.image_url.trim()) ||
    "";

  // ID de YouTube: extraído de la URL configurada, de metadata.videoId o el ID por defecto de Talleres
  const ytId =
    extractYouTubeId(rawUrl) ||
    (typeof meta.videoId === "string" && meta.videoId.trim()) ||
    VIDEO_TALLERES_ID;

  // Resolución segura del póster local
  const posterCandidate =
    (typeof meta.posterUrl === "string" && meta.posterUrl.trim()) ||
    (typeof meta.poster === "string" && meta.poster.trim()) ||
    "";
  const posterUrl = posterCandidate || "/videos/talleres/miniatura-youtube-1280x720.jpg";

  return (
    <section
      id="seccion-video"
      className="border-y border-slate-200/60 bg-gradient-to-b from-slate-50 to-white py-14 dark:border-slate-800 dark:from-slate-900/60 dark:to-slate-950 lg:py-20"
      aria-labelledby="video-heading"
    >
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Columna de Texto Contextual (Izquierda en Tablet/Desktop) */}
          <div className="flex flex-col text-center lg:col-span-7 lg:text-left">
            <div className="mb-3 inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-larioja-azul dark:text-sky-400 lg:justify-start">
              <span aria-hidden="true">🎥</span> Testimonio Audiovisual
            </div>

            <h2
              id="video-heading"
              className="font-montserrat text-2xl font-extrabold text-larioja-azul dark:text-larioja-amarillo sm:text-3xl lg:text-4xl lg:leading-tight"
            >
              {title}
            </h2>

            <p className="mt-2 text-base font-semibold text-slate-700 dark:text-slate-200 sm:text-lg">
              {contextSubtitle}
            </p>

            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
              {description}
            </p>

            {/* Puntos clave / Valores de los talleres */}
            <div className="mt-6 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
              <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200/70 bg-white/80 p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-larioja-amarillo/20 text-xs text-larioja-azul dark:text-larioja-amarillo">
                  ✓
                </span>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                    Talleres productivos
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Panadería, costura, carpintería y habilidades manuales.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200/70 bg-white/80 p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-larioja-amarillo/20 text-xs text-larioja-azul dark:text-larioja-amarillo">
                  ✓
                </span>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                    Autonomía e inclusión
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Herramientas para la independencia laboral y la vida.
                  </p>
                </div>
              </div>
            </div>

            {/* Enlaces de acción */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:justify-start">
              <Link
                href="/programs"
                className="inline-flex items-center justify-center rounded-full bg-larioja-azul px-6 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-larioja-azul/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-azul dark:bg-larioja-amarillo dark:text-larioja-azul sm:text-sm"
              >
                Conocer nuestros programas
              </Link>
              <Link
                href="/apoyanos"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:text-sm"
              >
                Apadrina un futuro
              </Link>
            </div>
          </div>

          {/* Columna de Video Vertical 9:16 (Derecha en Tablet/Desktop) */}
          <div className="flex justify-center lg:col-span-5">
            <YouTubeTalleres
              videoId={ytId}
              titulo={title}
              poster={posterUrl}
              maxWidth={360}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default VideoSection;
