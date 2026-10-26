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
    <section className="bg-surface-page py-16 lg:py-20 border-b border-line" aria-labelledby="stages-heading">
      <div className="mx-auto max-w-screen-xl px-4 lg:px-8">
        <div className="mb-8 flex flex-col gap-1">
          <h2
            id="stages-heading"
            className="font-montserrat text-2xl font-extrabold text-larioja-azul dark:text-larioja-amarillo lg:text-3xl"
          >
            Acompañamos cada etapa
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Una trayectoria integral desde la formación primaria hasta la inserción vocacional.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {stages.map((s) => {
            const meta = (s.metadata ?? {}) as Record<string, string>;
            const imgSrc = (s.image_url || "").trim() || (meta.foto || "").trim() || null;
            const isColegio = s.section_key.includes("colegio");
            return (
              <article
                key={s.section_key}
                className="group flex flex-col justify-between overflow-hidden rounded-tile border border-line bg-surface-card shadow-tremor-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div>
                  {imgSrc && (
                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={imgSrc}
                        alt={meta.foto_alt ?? s.title ?? ""}
                        fill
                        sizes="(max-width: 767px) 100vw, 50vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {meta.edad && (
                        <span
                          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-extrabold shadow-sm ${
                            isColegio
                              ? "bg-larioja-azul text-white dark:bg-blue-600"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          {meta.edad}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 p-6">
                    {!imgSrc && meta.edad && (
                      <span className="w-fit rounded-full bg-larioja-azul/10 px-3 py-1 text-xs font-semibold text-larioja-azul-enlace dark:bg-larioja-azul/30 dark:text-larioja-azul-celeste">
                        {meta.edad}
                      </span>
                    )}
                    <h3 className="font-montserrat text-xl font-extrabold text-ink transition-colors group-hover:text-larioja-azul-enlace dark:group-hover:text-larioja-amarillo">
                      {s.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-ink-muted">{s.description}</p>
                  </div>
                </div>

                {meta.enlace && meta.boton && (
                  <div className="px-6 pb-6 pt-1">
                    <Link
                      href={meta.enlace}
                      className="inline-flex min-h-[44px] w-fit items-center gap-1.5 rounded-full border-2 border-larioja-azul px-5 py-2.5 text-sm font-bold text-larioja-azul transition-all hover:bg-larioja-azul hover:text-white dark:border-larioja-amarillo dark:text-larioja-amarillo dark:hover:bg-larioja-amarillo dark:hover:text-larioja-azul"
                    >
                      {meta.boton} →
                    </Link>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
