"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check } from "lucide-react";
import {
  BTN_NAVY,
  BTN_OUTLINE,
  CONTAINER,
  H2,
  MUTED,
  SECTION_ANCHOR,
  SECTION_PLAIN,
  SECTION_Y,
} from "@/components/site/section-ui";
import type { AgeProgram } from "./types";

interface AgeSelectorProps {
  title: string;
  intro: string;
  programs: AgeProgram[];
}

/**
 * «Un programa para cada etapa» (#programas): Colegio (#colegio) y CFL (#cfl).
 * Desde `md` las dos tarjetas van lado a lado; en celular se eligen con
 * pestañas accesibles (flechas ←/→). El CFL viene seleccionado.
 */
export function AgeSelector({ title, intro, programs }: AgeSelectorProps) {
  const [active, setActive] = useState<AgeProgram["id"]>(
    programs.some((p) => p.id === "cfl") ? "cfl" : (programs[0]?.id ?? "cfl"),
  );
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Un enlace a #colegio o #cfl (p. ej. «Conocer el Colegio» de Nosotros)
  // abre su pestaña en celular, para que el ancla no apunte a un panel oculto.
  useEffect(() => {
    const syncWithHash = () => {
      const id = window.location.hash.slice(1);
      const target = programs.find((p) => p.id === id);
      if (!target) return;
      setActive(target.id);
      requestAnimationFrame(() => document.getElementById(target.id)?.scrollIntoView());
    };
    syncWithHash();
    window.addEventListener("hashchange", syncWithHash);
    return () => window.removeEventListener("hashchange", syncWithHash);
  }, [programs]);

  if (programs.length === 0) return null;
  const tabs = programs.length > 1;

  /** Mueve la pestaña activa con las flechas, como indica el patrón ARIA. */
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const step = e.key === "ArrowRight" ? 1 : -1;
    const next = programs[(index + step + programs.length) % programs.length];
    setActive(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <section id="programas" className={`${SECTION_PLAIN} ${SECTION_ANCHOR}`}>
      <div className={`${CONTAINER} ${SECTION_Y} flex flex-col gap-7`}>
        <div className="flex max-w-[760px] flex-col gap-2.5">
          <h2 className={`${H2} m-0`}>{title}</h2>
          {intro && <p className={`m-0 text-lg leading-relaxed ${MUTED}`}>{intro}</p>}
        </div>

        {tabs && (
          <div
            role="tablist"
            aria-label="Programas por edad"
            className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[#F3F5F8] p-1.5 md:hidden dark:bg-white/10"
          >
            {programs.map((p, i) => {
              const selected = active === p.id;
              return (
                <button
                  key={p.id}
                  ref={(el) => {
                    tabRefs.current[p.id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${p.id}`}
                  aria-controls={p.id}
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(p.id)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  className={`min-h-[56px] rounded-xl px-2 py-1.5 font-montserrat text-[15px] font-bold leading-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul-enlace ${
                    selected
                      ? "bg-larioja-azul text-white dark:bg-larioja-amarillo dark:text-larioja-azul"
                      : "text-larioja-azul dark:text-white"
                  }`}
                >
                  {p.tab}
                  {p.ages && (
                    <span className="block text-xs font-medium opacity-90">
                      {p.ages.replace(/^De\s+/i, "")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {programs.map((p) => (
            <article
              key={p.id}
              id={p.id}
              {...(tabs ? { role: "tabpanel", "aria-labelledby": `tab-${p.id}` } : {})}
              className={`${SECTION_ANCHOR} flex-col gap-3.5 rounded-[22px] bg-white p-6 sm:p-[30px] md:flex dark:bg-surface-card ${
                p.featured
                  ? "border-2 border-larioja-azul dark:border-larioja-amarillo"
                  : "border border-line"
              } ${active === p.id || !tabs ? "flex" : "hidden"}`}
            >
              {(p.ages || p.focus) && (
                <span
                  className={`self-start rounded-full px-3 py-1.5 font-montserrat text-[13px] font-bold text-larioja-azul ${
                    p.featured ? "bg-larioja-amarillo" : "bg-[#F3F5F8] dark:bg-white"
                  }`}
                >
                  {[p.ages, p.focus].filter(Boolean).join(" · ")}
                </span>
              )}
              <h3 className="m-0 font-montserrat text-[24px] font-extrabold text-larioja-azul sm:text-[26px] dark:text-white">
                {p.name}
              </h3>
              {p.text && (
                <p className="m-0 text-base leading-relaxed text-gray-700 dark:text-white/80">
                  {p.text}
                </p>
              )}
              {p.includes.length > 0 && (
                <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[15px] text-gray-700 dark:text-white/80">
                  {p.includes.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Check
                        size={20}
                        strokeWidth={2.4}
                        className="shrink-0 text-larioja-verde-texto dark:text-larioja-verde"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {p.cta.label && (
                <a
                  href={p.cta.href}
                  className={`${p.featured ? BTN_NAVY : BTN_OUTLINE} mt-auto min-h-[48px] self-start rounded-full px-5 text-[15px]`}
                >
                  {p.cta.label}
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
