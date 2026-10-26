import React from "react";
import Image from "next/image";
import Link from "next/link";
import { GraduationCap, Briefcase, ArrowRight } from "lucide-react";
import type { SiteContent } from "@/types/cms";

interface MatriculaProgramasProps {
  programasSection: SiteContent | null;
  colegioSection: SiteContent | null;
  cflSection: SiteContent | null;
}

export function MatriculaProgramas({
  programasSection,
  colegioSection,
  cflSection,
}: MatriculaProgramasProps) {
  if (!programasSection || !programasSection.is_active) {
    return null;
  }

  const title = programasSection.title || "Colegio y CFL";
  const description =
    programasSection.description ||
    "Dos modalidades diseñadas para potenciar la autonomía, el aprendizaje y la inclusión laboral.";

  const colegioMeta = (colegioSection?.metadata || {}) as Record<string, unknown>;
  const colegioLinkHref = (colegioMeta.link_href as string) || "/programs#colegio";
  const colegioLinkLabel =
    (colegioMeta.link_label as string) || "Conoce nuestra propuesta educativa";
  const colegioShowLink = colegioMeta.show_link !== false;
  const colegioImageAlt =
    (colegioMeta.image_alt as string) || colegioSection?.title || "Colegio La Rioja";

  const cflMeta = (cflSection?.metadata || {}) as Record<string, unknown>;
  const cflLinkHref = (cflMeta.link_href as string) || "/programs#cfl";
  const cflLinkLabel =
    (cflMeta.link_label as string) || "Consulta nuestras opciones de formación";
  const cflShowLink = cflMeta.show_link !== false;
  const cflImageAlt =
    (cflMeta.image_alt as string) || cflSection?.title || "Centro de Formación Laboral";

  return (
    <section className="bg-gray-50/70 dark:bg-gray-900/40 py-16 sm:py-20 border-b border-gray-100 dark:border-gray-800">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-montserrat text-2xl sm:text-3xl lg:text-4xl font-bold text-larioja-azul dark:text-larioja-amarillo">
            {title}
          </h2>
          {description && (
            <p className="font-inter mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-300">
              {description}
            </p>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Tarjeta Colegio */}
          {colegioSection && colegioSection.is_active && (
            <div className="flex flex-col justify-between rounded-3xl bg-white dark:bg-gray-800 p-8 shadow-sm border border-gray-100 dark:border-gray-700/60 transition-all hover:shadow-md">
              <div>
                {colegioSection.image_url ? (
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl mb-6 bg-gray-100 dark:bg-gray-900">
                    <Image
                      src={colegioSection.image_url}
                      alt={colegioImageAlt}
                      fill
                      sizes="(min-width: 768px) 45vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-larioja-azul dark:bg-blue-950 dark:text-blue-300 mb-6">
                    <GraduationCap size={28} />
                  </div>
                )}
                <h3 className="font-montserrat text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {colegioSection.title || "Colegio La Rioja"}
                </h3>
                <p className="font-inter text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                  {colegioSection.description ||
                    "Conoce nuestra propuesta educativa adaptada para jóvenes de 12 a 20 años."}
                </p>
              </div>

              {colegioShowLink && (
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <Link
                    href={colegioLinkHref}
                    className="inline-flex min-h-[44px] items-center gap-2 font-montserrat text-sm font-bold text-larioja-azul hover:text-larioja-azul-profundo dark:text-larioja-amarillo focus-visible:outline focus-visible:outline-2 focus-visible:outline-larioja-azul"
                  >
                    <span>{colegioLinkLabel}</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Tarjeta Centro de Formación Laboral (CFL) */}
          {cflSection && cflSection.is_active && (
            <div className="flex flex-col justify-between rounded-3xl bg-white dark:bg-gray-800 p-8 shadow-sm border border-gray-100 dark:border-gray-700/60 transition-all hover:shadow-md">
              <div>
                {cflSection.image_url ? (
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl mb-6 bg-gray-100 dark:bg-gray-900">
                    <Image
                      src={cflSection.image_url}
                      alt={cflImageAlt}
                      fill
                      sizes="(min-width: 768px) 45vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 mb-6">
                    <Briefcase size={28} />
                  </div>
                )}
                <h3 className="font-montserrat text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {cflSection.title || "Centro de Formación Laboral"}
                </h3>
                <p className="font-inter text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                  {cflSection.description ||
                    "Consulta nuestras opciones de formación vocacional para personas de 20 a 55 años."}
                </p>
              </div>

              {cflShowLink && (
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <Link
                    href={cflLinkHref}
                    className="inline-flex min-h-[44px] items-center gap-2 font-montserrat text-sm font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
                  >
                    <span>{cflLinkLabel}</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
