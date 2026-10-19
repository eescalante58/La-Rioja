"use client";

import Link from "next/link";
import type { SiteContent } from "@/types/cms";
import {
  YouTubeTalleres,
  VIDEO_TALLERES_ID,
  extractYouTubeId,
  isDirectVideoUrl,
  type VideoAspectRatio,
} from "./YouTubeTalleres";

interface Props {
  video: SiteContent | null;
}

const DEFAULT_POSTER_TALLERES = "/videos/talleres/miniatura-youtube-1280x720.jpg";

/**
 * Normaliza `metadata.aspect` aceptando `"9:16"`, `"9,16"`, `"16:9"`, `"16,9"`,
 * `"vertical"` u `"horizontal"`.
 */
function resolveAspectRatio(rawAspect: unknown, fallbackYtId: string | null): VideoAspectRatio {
  if (typeof rawAspect === "string" && rawAspect.trim()) {
    const normalized = rawAspect
      .trim()
      .toLowerCase()
      .replace(/[,;/\s-]+/g, ":");
    if (normalized === "16:9" || normalized === "horizontal") return "16:9";
    if (normalized === "9:16" || normalized === "vertical") return "9:16";
  }
  if (fallbackYtId === "oTpQfUKE9As") return "16:9";
  return "9:16";
}

/**
 * Sección — Video institucional / Testimonio Audiovisual (`cl_video`).
 * Soporta tanto videos subidos a Supabase Storage (`.mp4`) como enlaces de YouTube,
 * y adapta su diseño según `metadata.aspect` (`"9:16"` vertical o `"16:9"` / `"16,9"` horizontal).
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

  const rawImageUrl = typeof video.image_url === "string" ? video.image_url.trim() : "";
  const rawMetaUrl = typeof meta.url === "string" ? meta.url.trim() : "";
  const rawMetaVideoId = typeof meta.videoId === "string" ? meta.videoId.trim() : "";

  // Priorizar cualquier URL que haya sido modificada respecto al valor semilla,
  // ya sea en `image_url` o en `metadata.url`.
  const legacyDefaultUrl = `https://youtu.be/${VIDEO_TALLERES_ID}`;
  const primaryUrl =
    rawImageUrl && rawImageUrl !== legacyDefaultUrl
      ? rawImageUrl
      : rawMetaUrl && rawMetaUrl !== legacyDefaultUrl
        ? rawMetaUrl
        : rawImageUrl || rawMetaUrl;

  const isDirectMp4 = isDirectVideoUrl(primaryUrl);
  const ytId = isDirectMp4
    ? null
    : extractYouTubeId(primaryUrl) ||
      extractYouTubeId(rawImageUrl) ||
      extractYouTubeId(rawMetaUrl) ||
      rawMetaVideoId ||
      VIDEO_TALLERES_ID;

  const aspect = resolveAspectRatio(meta.aspect, ytId);
  const isHorizontal = aspect === "16:9";

  // Resolución segura del póster: si se cambió a otro video de YouTube y el póster
  // sigue siendo el de `0rCP5NMMasY`, usar la miniatura oficial del nuevo video.
  const posterCandidate =
    (typeof meta.posterUrl === "string" && meta.posterUrl.trim()) ||
    (typeof meta.poster === "string" && meta.poster.trim()) ||
    "";
  const isLegacyDefaultPoster = posterCandidate === DEFAULT_POSTER_TALLERES;
  const posterUrl =
    posterCandidate && (!isLegacyDefaultPoster || ytId === VIDEO_TALLERES_ID || isDirectMp4)
      ? posterCandidate
      : ytId && ytId !== VIDEO_TALLERES_ID
        ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
        : DEFAULT_POSTER_TALLERES;

  // Duración opcional en el botón de portada
  const rawDuracion =
    (typeof meta.duracion === "string" && meta.duracion.trim()) ||
    (typeof meta.duration === "string" && meta.duration.trim()) ||
    "";
  const duracion =
    rawDuracion ||
    (ytId === "oTpQfUKE9As" ? "1:30" : ytId === VIDEO_TALLERES_ID && !isDirectMp4 ? "4:18" : undefined);

  return (
    <section
      id="seccion-video"
      className="border-y border-slate-200/60 bg-gradient-to-b from-slate-50 to-white py-14 dark:border-slate-800 dark:from-slate-900/60 dark:to-slate-950 lg:py-20"
      aria-labelledby="video-heading"
    >
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Columna de Texto Contextual (Izquierda en Tablet/Desktop) */}
          <div
            className={`flex flex-col text-center lg:text-left ${
              isHorizontal ? "lg:col-span-6" : "lg:col-span-7"
            }`}
          >
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
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-larioja-azul px-6 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-larioja-azul/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-azul dark:bg-larioja-amarillo dark:text-larioja-azul sm:text-sm"
              >
                Conocer nuestros programas
              </Link>
              <Link
                href="/apoyanos"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:text-sm"
              >
                Apadrina un futuro
              </Link>
            </div>
          </div>

          {/* Columna de Video (9:16 vertical o 16:9 horizontal según metadata.aspect) */}
          <div
            className={`flex justify-center ${
              isHorizontal ? "lg:col-span-6" : "lg:col-span-5"
            }`}
          >
            <YouTubeTalleres
              videoUrl={primaryUrl || undefined}
              videoId={ytId ?? undefined}
              titulo={title}
              poster={posterUrl}
              aspect={aspect}
              maxWidth={isHorizontal ? 680 : 360}
              duracion={duracion}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default VideoSection;
