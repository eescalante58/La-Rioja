import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  BTN_NAVY,
  CONTAINER,
  H2,
  MUTED,
  SECTION_ANCHOR,
  SECTION_PLAIN,
  SECTION_Y,
} from "@/components/site/section-ui";
import type { Workshop } from "./types";

/** Foto del taller o, si no hay, recuadro de marca con icono y nombre. */
function WorkshopMedia({ workshop, sizes }: { workshop: Workshop; sizes: string }) {
  if (!workshop.image) {
    return (
      <div
        aria-hidden="true"
        className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 bg-larioja-azul dark:bg-larioja-azul-profundo"
      >
        {/* Icono de pincel cuando no hay foto */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-larioja-amarillo"
          aria-hidden="true"
        >
          <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
          <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
          <path d="M14.5 17.5 4.5 15" />
        </svg>
        <span className="font-montserrat text-[18px] font-extrabold text-larioja-amarillo">
          {workshop.name}
        </span>
      </div>
    );
  }
  return (
    <div className="relative aspect-[16/10] w-full">
      <Image
        src={workshop.image.url}
        alt={workshop.image.alt}
        fill
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}

/** Líneas de hechos de un taller: habilidades, impacto y productos (se omiten los vacíos). */
function WorkshopFacts({ workshop }: { workshop: Workshop }) {
  const facts = [
    { label: "Habilidades", value: workshop.skills },
    { label: "Impacto en la vida diaria", value: workshop.impact },
    { label: "Productos", value: workshop.products },
  ].filter((f) => f.value);

  if (facts.length === 0) return null;
  return (
    <dl className="m-0 flex flex-col gap-2.5 text-[15px] leading-normal">
      {facts.map((f) => (
        <div key={f.label}>
          <dt className="font-bold text-larioja-azul dark:text-white">{f.label}</dt>
          <dd className={`m-0 mt-0.5 ${MUTED}`}>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface TalleresGridProps {
  title: string;
  intro: string;
  workshops: Workshop[];
  /** Botón final (p. ej. a /productos); sin etiqueta no se muestra. */
  cta: { label: string; href: string };
}

/**
 * «Talleres donde se aprende haciendo» (#talleres): cuadrícula de talleres productivos.
 * El taller insignia (Panadería) ocupa el ancho completo; el resto forma una fila de cuatro.
 * Server Component: sin estado ni JavaScript en el navegador.
 */
export function TalleresGrid({ title, intro, workshops, cta }: TalleresGridProps) {
  if (workshops.length === 0) return null;

  return (
    <section id="talleres" className={`${SECTION_PLAIN} ${SECTION_ANCHOR}`}>
      <div className={`${CONTAINER} ${SECTION_Y} flex flex-col gap-7`}>
        <div className="flex max-w-[780px] flex-col gap-2.5">
          <h2 className={`${H2} m-0`}>{title}</h2>
          {intro && <p className={`m-0 text-lg leading-relaxed ${MUTED}`}>{intro}</p>}
        </div>

        <ul role="list" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {workshops.map((w) => {
            if (w.badge) {
              return (
                <li key={w.slug} className="sm:col-span-2 lg:col-span-4">
                  <article className="flex flex-col overflow-hidden rounded-[22px] bg-[#F3F5F8] lg:flex-row dark:bg-surface-card">
                    <div className="w-full lg:basis-[52%]">
                      <WorkshopMedia workshop={w} sizes="(max-width: 1023px) 100vw, 660px" />
                    </div>
                    <div className="flex flex-col justify-center gap-3 p-6 sm:p-[30px] lg:basis-[48%]">
                      <span className="self-start rounded-full border-2 border-larioja-azul bg-larioja-amarillo px-3 py-1 font-montserrat text-xs font-bold text-larioja-azul">
                        {w.badge}
                      </span>
                      <h3 className="m-0 font-montserrat text-[28px] font-extrabold text-larioja-azul dark:text-white">
                        {w.name}
                      </h3>
                      <WorkshopFacts workshop={w} />
                    </div>
                  </article>
                </li>
              );
            }

            return (
              <li key={w.slug}>
                <article className="flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-white dark:bg-surface-card">
                  <WorkshopMedia
                    workshop={w}
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                  />
                  <div className="flex flex-1 flex-col gap-2.5 p-[22px]">
                    <h3 className="m-0 font-montserrat text-[21px] font-bold text-larioja-azul dark:text-white">
                      {w.name}
                    </h3>
                    <WorkshopFacts workshop={w} />
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        {cta.label && (
          <div>
            <Link href={cta.href} className={`${BTN_NAVY} w-full rounded-full text-base sm:w-auto`}>
              {cta.label}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
