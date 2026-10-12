"use client";

import { useState } from "react";
import type { AdaptiveLevel } from "./types";

interface AdaptiveLevelsProps {
  levels: AdaptiveLevel[];
}

/**
 * Recorrido de los cinco niveles del CFL: lista de pasos unida por una línea
 * y panel con el detalle del nivel elegido (el primero viene abierto). En
 * escritorio el detalle queda a la derecha; en celular, debajo de la lista.
 */
export function AdaptiveLevels({ levels }: AdaptiveLevelsProps) {
  const [current, setCurrent] = useState<number>(levels[0]?.n ?? 1);
  const level = levels.find((l) => l.n === current) ?? levels[0];
  if (!level) return null;

  const details = [
    { label: "Objetivo", value: level.goal },
    { label: "Cómo trabajamos", value: level.approach },
    { label: "Logro esperado", value: level.outcome },
  ].filter((d) => d.value);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <ol className="m-0 flex list-none flex-col gap-1.5 border-l-2 border-larioja-azul py-0 pl-3 pr-0 sm:pl-[18px] dark:border-larioja-amarillo">
        {levels.map((l) => {
          const selected = l.n === current;
          return (
            <li key={l.n}>
              <button
                type="button"
                aria-expanded={selected}
                aria-controls="nivel-detalle"
                onClick={() => setCurrent(l.n)}
                className={`flex min-h-[56px] w-full items-center gap-3 rounded-[14px] px-3 py-2 text-left font-montserrat text-base font-bold transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul-enlace ${
                  selected
                    ? "bg-larioja-azul text-white dark:bg-larioja-amarillo dark:text-larioja-azul"
                    : "text-larioja-azul hover:bg-white dark:text-white dark:hover:bg-white/10"
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-extrabold ${
                    selected
                      ? "bg-larioja-amarillo text-larioja-azul dark:bg-larioja-azul dark:text-larioja-amarillo"
                      : "bg-larioja-azul text-larioja-amarillo"
                  }`}
                  aria-hidden="true"
                >
                  {l.n}
                </span>
                <span>
                  <span className="sr-only">Nivel {l.n}: </span>
                  {l.name}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <section
        id="nivel-detalle"
        aria-live="polite"
        className="flex flex-col gap-[18px] rounded-[22px] bg-white p-6 sm:p-[30px] dark:bg-surface-card"
      >
        <div className="flex items-center gap-3.5">
          <span
            className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border-[3px] border-larioja-azul bg-larioja-amarillo font-montserrat text-[22px] font-extrabold text-larioja-azul"
            aria-hidden="true"
          >
            {level.n}
          </span>
          <h3 className="m-0 font-montserrat text-[22px] font-extrabold text-larioja-azul sm:text-2xl dark:text-white">
            Nivel {level.n}: {level.name}
          </h3>
        </div>
        {details.length > 0 && (
          <dl className="m-0 flex flex-col gap-4">
            {details.map((d) => (
              <div key={d.label}>
                <dt className="font-montserrat text-sm font-bold text-larioja-azul dark:text-larioja-amarillo">
                  {d.label}
                </dt>
                <dd className="m-0 mt-1 text-base leading-relaxed text-gray-700 dark:text-white/80">
                  {d.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  );
}
