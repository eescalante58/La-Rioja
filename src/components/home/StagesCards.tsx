import Image from "next/image";
import Link from "next/link";
import type { SiteContent } from "@/types/cms";

interface Props {
  colegio: SiteContent | null;
  cfl: SiteContent | null;
}

/** Sección 3 — Colegio La Rioja y CFL como dos tarjetas abiertas. */
export function StagesCards({ colegio, cfl }: Props) {
  const stages = [colegio, cfl].filter(Boolean) as SiteContent[];
  if (stages.length === 0) return null;

  return (
    <section className="bg-white py-16 dark:bg-gray-950 lg:py-20" aria-labelledby="stages-heading">
      <div className="mx-auto max-w-screen-xl px-4 lg:px-8">
        <h2
          id="stages-heading"
          className="mb-8 font-montserrat text-2xl font-extrabold text-larioja-azul dark:text-larioja-amarillo lg:text-3xl"
        >
          Acompañamos cada etapa
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          {stages.map((s) => {
            const meta = (s.metadata ?? {}) as Record<string, string>;
            const imgSrc = s.image_url ?? meta.foto ?? null;
            return (
              <article
                key={s.section_key}
                className="flex flex-col overflow-hidden rounded-tile border border-line bg-surface-card shadow-tremor-card"
              >
                {imgSrc && (
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={imgSrc}
                      alt={meta.foto_alt ?? s.title ?? ""}
                      fill
                      sizes="(max-width: 767px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-3 p-6">
                  {meta.edad && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-larioja-azul-enlace dark:text-larioja-azul-celeste">
                      {meta.edad}
                    </span>
                  )}
                  <h3 className="font-montserrat text-xl font-extrabold text-ink">{s.title}</h3>
                  <p className="flex-1 text-sm leading-relaxed text-ink-muted">{s.description}</p>
                  {meta.enlace && meta.boton && (
                    <Link
                      href={meta.enlace}
                      className="mt-2 inline-flex w-fit items-center gap-1 rounded-full border-2 border-larioja-azul px-5 py-2 text-sm font-bold text-larioja-azul transition-colors hover:bg-larioja-azul hover:text-white dark:border-larioja-amarillo dark:text-larioja-amarillo dark:hover:bg-larioja-amarillo dark:hover:text-larioja-azul"
                    >
                      {meta.boton}
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
