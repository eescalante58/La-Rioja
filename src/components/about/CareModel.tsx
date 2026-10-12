"use client";

import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import {
  BTN_NAVY,
  BTN_OUTLINE,
  CONTAINER,
  H2,
  H3,
  MUTED,
  SECTION_ANCHOR,
  SECTION_PLAIN,
  SECTION_Y,
} from "@/components/site/section-ui";

/** Programa del comparador (Colegio o CFL), ya leído del CMS. */
export interface CareProgram {
  key: string;
  name: string;
  age: string;
  focus: string;
  text: string;
  button: string;
  href: string;
  /** Tarjeta destacada (borde azul, insignia amarilla y botón relleno). */
  featured: boolean;
}

/** Nivel del CFL; `text` vacío = sin descripción publicada. */
export interface CareLevel {
  key: string;
  name: string;
  text: string;
}

interface CareModelProps {
  title: string;
  intro: string;
  programs: CareProgram[];
  levelsTitle: string;
  levelsIntro: string;
  levels: CareLevel[];
  areasTitle: string;
  areas: string[];
}

/** Tarjeta de un programa del comparador. */
function ProgramCard({ program }: { program: CareProgram }) {
  return (
    <article
      className={`flex h-full flex-col gap-4 rounded-[22px] bg-white p-6 sm:p-[30px] dark:bg-surface-card ${
        program.featured
          ? "border-2 border-larioja-azul dark:border-larioja-amarillo"
          : "border border-line"
      }`}
    >
      {program.age && (
        <span
          className={`self-start rounded-full px-3 py-1.5 font-montserrat text-[13px] font-bold text-larioja-azul ${
            program.featured ? "bg-larioja-amarillo" : "bg-[#F3F5F8] dark:bg-white"
          }`}
        >
          {program.age}
        </span>
      )}
      <h3 className="m-0 font-montserrat text-[26px] font-extrabold text-larioja-azul dark:text-white">
        {program.name}
      </h3>
      {program.focus && (
        <p className="m-0 text-[13px] font-bold uppercase tracking-[0.06em] text-gray-600 dark:text-white/70">
          {program.focus}
        </p>
      )}
      {program.text && (
        <p className="m-0 text-base leading-relaxed text-gray-700 dark:text-white/80">
          {program.text}
        </p>
      )}
      {program.button && (
        <Link
          href={program.href}
          className={`${program.featured ? BTN_NAVY : BTN_OUTLINE} mt-auto min-h-[48px] self-start rounded-full px-5 text-[15px]`}
        >
          {program.button}
        </Link>
      )}
    </article>
  );
}

/**
 * «Modelo de atención» (#modelo): comparador Colegio / CFL (dos columnas en
 * escritorio; pestañas con flechas de teclado en celular), franja de los
 * cinco niveles y áreas comunes a todos los niveles.
 */
export function CareModel({
  title,
  intro,
  programs,
  levelsTitle,
  levelsIntro,
  levels,
  areasTitle,
  areas,
}: CareModelProps) {
  const baseId = useId();
  const tabsRef = useRef<HTMLDivElement>(null);
  const initial = Math.max(
    0,
    programs.findIndex((p) => p.featured),
  );
  const [selected, setSelected] = useState(initial);

  /** Flechas, Inicio y Fin mueven la pestaña activa (patrón ARIA de pestañas). */
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = programs.length - 1;
    let next = selected;
    if (e.key === "ArrowRight") next = selected === last ? 0 : selected + 1;
    else if (e.key === "ArrowLeft") next = selected === 0 ? last : selected - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    setSelected(next);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <section id="modelo" className={`${SECTION_PLAIN} ${SECTION_ANCHOR}`}>
      <div className={`${CONTAINER} ${SECTION_Y} flex flex-col gap-8`}>
        <div className="flex max-w-[760px] flex-col gap-2.5">
          <h2 className={`${H2} m-0`}>{title}</h2>
          {intro && <p className={`m-0 text-lg leading-relaxed ${MUTED}`}>{intro}</p>}
        </div>

        {programs.length > 0 && (
          <div className="flex flex-col gap-4">
            {programs.length > 1 && (
              <div
                ref={tabsRef}
                role="tablist"
                aria-label="Programas"
                className="grid gap-1.5 rounded-2xl bg-[#F3F5F8] p-1.5 md:hidden dark:bg-white/10"
                style={{ gridTemplateColumns: `repeat(${programs.length}, minmax(0, 1fr))` }}
              >
                {programs.map((p, i) => {
                  const on = i === selected;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      role="tab"
                      id={`${baseId}-tab-${i}`}
                      aria-selected={on}
                      aria-controls={`${baseId}-panel-${i}`}
                      tabIndex={on ? 0 : -1}
                      onClick={() => setSelected(i)}
                      onKeyDown={onKeyDown}
                      className={`min-h-[48px] rounded-xl px-2.5 py-2 font-montserrat text-[15px] font-bold leading-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul-enlace dark:focus-visible:outline-larioja-amarillo ${
                        on
                          ? "bg-larioja-azul text-white dark:bg-larioja-amarillo dark:text-larioja-azul"
                          : "bg-transparent text-larioja-azul dark:text-white"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {programs.map((p, i) => (
                <div
                  key={p.key}
                  id={`${baseId}-panel-${i}`}
                  role={programs.length > 1 ? "tabpanel" : undefined}
                  aria-labelledby={programs.length > 1 ? `${baseId}-tab-${i}` : undefined}
                  className={i === selected ? "" : "hidden md:block"}
                >
                  <ProgramCard program={p} />
                </div>
              ))}
            </div>
          </div>
        )}

        {levels.length > 0 && (
          <div className="flex flex-col gap-[18px] pt-3">
            <h3 className={`${H3} m-0`}>{levelsTitle}</h3>
            {levelsIntro && (
              <p className={`m-0 max-w-[760px] text-base leading-relaxed ${MUTED}`}>
                {levelsIntro}
              </p>
            )}
            <ol className="m-0 grid list-none grid-cols-1 gap-3 p-0 lg:grid-flow-col lg:auto-cols-fr">
              {levels.map((l, i) => (
                <li
                  key={l.key}
                  className="relative flex items-start gap-3.5 rounded-2xl bg-[#F3F5F8] p-5 dark:bg-slate-900/60 lg:flex-col lg:gap-2.5"
                >
                  {/* Conector entre pasos: vertical en celular, horizontal desde lg. */}
                  {i < levels.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[39px] top-[60px] h-[calc(100%-28px)] w-0.5 bg-larioja-azul/30 dark:bg-white/30 lg:left-[60px] lg:top-[39px] lg:h-0.5 lg:w-[calc(100%-28px)]"
                    />
                  )}
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-larioja-azul font-montserrat text-lg font-extrabold text-larioja-amarillo dark:bg-larioja-amarillo dark:text-larioja-azul">
                    {i + 1}
                  </span>
                  <span className="flex min-w-0 flex-col gap-1.5">
                    <strong className="font-montserrat text-base text-larioja-azul dark:text-white">
                      {l.name}
                    </strong>
                    {l.text && <span className={`text-sm leading-normal ${MUTED}`}>{l.text}</span>}
                  </span>
                </li>
              ))}
            </ol>
            {areas.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-sm font-semibold text-gray-700 dark:text-white/80">
                  {areasTitle}
                </span>
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {areas.map((a) => (
                    <li
                      key={a}
                      className="rounded-full border border-[#7C879C] px-3 py-[7px] text-[13px] text-larioja-azul dark:border-white/40 dark:text-white"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
