"use client";

import { useState } from "react";
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
import type { Workshop, WorkshopGroup } from "./types";

type Filter = "todos" | WorkshopGroup;

interface WorkshopGridProps {
  title: string;
  intro: string;
  workshops: Workshop[];
  /** Botón final (p. ej. a /productos); sin etiqueta no se muestra. */
  cta: { label: string; href: string };
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "productivo", label: "Talleres productivos" },
  { id: "vida-independiente", label: "Vida independiente" },
];

const GROUP_LABEL: Record<WorkshopGroup, string> = {
  productivo: "Productivo",
  "vida-independiente": "Vida independiente",
};

/** Texto de la región `aria-live` con el resultado del filtro. */
function resultNote(filter: Filter, count: number): string {
  const noun = count === 1 ? "taller" : "talleres";
  if (filter === "productivo")
    return `Mostrando ${count} ${noun} ${count === 1 ? "productivo" : "productivos"}`;
  if (filter === "vida-independiente") return `Mostrando ${count} ${noun} de vida independiente`;
  return `Mostrando ${count === 1 ? "el" : `los ${count}`} ${noun}`;
}

/** Foto del taller o, si no hay, bloque azul con su nombre (decorativo). */
function WorkshopMedia({ workshop, sizes }: { workshop: Workshop; sizes: string }) {
  if (!workshop.image) {
    return (
      <div
        aria-hidden="true"
        className="grid aspect-[16/10] w-full place-items-center bg-larioja-azul font-montserrat text-[22px] font-extrabold text-larioja-amarillo dark:bg-larioja-azul-profundo"
      >
        {workshop.name}
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

/** Líneas de habilidades, impacto y productos; las vacías se omiten. */
function workshopFacts(w: Workshop): { label: string; value: string }[] {
  return [
    { label: "Habilidades", value: w.skills },
    { label: "Impacto en la vida diaria", value: w.impact },
    { label: "Productos", value: w.products },
  ].filter((f) => f.value);
}

/**
 * «Talleres donde se aprende haciendo» (#talleres): filtros por grupo
 * (productivos / vida independiente), taller insignia a lo ancho y una
 * tarjeta abierta por cada taller, con habilidades, impacto y productos.
 */
export function WorkshopGrid({ title, intro, workshops, cta }: WorkshopGridProps) {
  const [filter, setFilter] = useState<Filter>("todos");
  if (workshops.length === 0) return null;

  const visible = workshops.filter((w) => filter === "todos" || w.group === filter);
  const groups = new Set(workshops.map((w) => w.group));

  return (
    <section id="talleres" className={`${SECTION_PLAIN} ${SECTION_ANCHOR}`}>
      <div className={`${CONTAINER} ${SECTION_Y} flex flex-col gap-7`}>
        <div className="flex max-w-[780px] flex-col gap-2.5">
          <h2 className={`${H2} m-0`}>{title}</h2>
          {intro && <p className={`m-0 text-lg leading-relaxed ${MUTED}`}>{intro}</p>}
        </div>

        {groups.size > 1 && (
          <div className="flex flex-col gap-3">
            <div role="group" aria-label="Filtrar talleres" className="flex flex-wrap gap-2">
              {FILTERS.map((f) => {
                const pressed = filter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => setFilter(f.id)}
                    className={`min-h-[44px] rounded-full px-[18px] font-montserrat text-[15px] font-semibold transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul-enlace ${
                      pressed
                        ? "border-2 border-larioja-azul bg-larioja-azul text-white dark:border-larioja-amarillo dark:bg-larioja-amarillo dark:text-larioja-azul"
                        : "border border-[#7C879C] bg-white text-larioja-azul hover:bg-[#F3F5F8] dark:bg-transparent dark:text-white dark:hover:bg-white/10"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
            <p aria-live="polite" className={`m-0 text-sm ${MUTED}`}>
              {resultNote(filter, visible.length)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((w) => {
            const facts = workshopFacts(w);
            if (w.badge) {
              return (
                <article
                  key={w.slug}
                  className="flex flex-col overflow-hidden rounded-[22px] bg-[#F3F5F8] sm:col-span-2 lg:col-span-3 lg:flex-row dark:bg-surface-card"
                >
                  <div className="w-full lg:basis-[52%]">
                    <WorkshopMedia workshop={w} sizes="(max-width: 1023px) 100vw, 660px" />
                  </div>
                  <div className="flex flex-col justify-center gap-3 p-6 sm:p-[30px] lg:basis-[48%]">
                    <span className="self-start rounded-full border-2 border-larioja-azul bg-larioja-amarillo px-3 py-1 font-montserrat text-xs font-bold text-larioja-azul">
                      {w.badge} · {GROUP_LABEL[w.group]}
                    </span>
                    <h3 className="m-0 font-montserrat text-[28px] font-extrabold text-larioja-azul dark:text-white">
                      {w.name}
                    </h3>
                    {facts.length > 0 && (
                      <dl className="m-0 flex flex-col gap-2.5 text-[15px] leading-normal">
                        {facts.map((f) => (
                          <div key={f.label}>
                            <dt className="font-bold text-larioja-azul dark:text-white">
                              {f.label}
                            </dt>
                            <dd className={`m-0 mt-0.5 ${MUTED}`}>{f.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </article>
              );
            }
            return (
              <article
                key={w.slug}
                className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-white dark:bg-surface-card"
              >
                <WorkshopMedia
                  workshop={w}
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                />
                <div className="flex flex-1 flex-col gap-2.5 p-[22px]">
                  <p
                    className={`m-0 text-xs font-bold uppercase tracking-[0.06em] ${
                      w.group === "productivo"
                        ? "text-larioja-verde-texto dark:text-larioja-verde"
                        : "text-larioja-azul-enlace dark:text-larioja-amarillo"
                    }`}
                  >
                    {GROUP_LABEL[w.group]}
                  </p>
                  <h3 className="m-0 font-montserrat text-[21px] font-bold text-larioja-azul dark:text-white">
                    {w.name}
                  </h3>
                  {facts.map((f) => (
                    <p key={f.label} className={`m-0 text-sm leading-normal ${MUTED}`}>
                      <strong className="text-larioja-azul dark:text-white">{f.label}:</strong>{" "}
                      {f.value}
                    </p>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

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
