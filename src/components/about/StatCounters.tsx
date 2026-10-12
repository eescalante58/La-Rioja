"use client";

import { useEffect, useRef, useState } from "react";

/** Contador ya validado (valor entero) para la franja de cifras. */
export interface Stat {
  key: string;
  value: number;
  prefix: string;
  suffix: string;
  label: string;
}

/** Duración de la animación de conteo (ms). */
const DURATION = 1200;

/**
 * Cifra que cuenta desde 0 al entrar en pantalla. El valor final se
 * renderiza en el servidor (se ve sin JavaScript) y con
 * `prefers-reduced-motion` no hay animación. Los lectores de pantalla
 * leen solo el valor final.
 */
function StatCounter({ value, prefix, suffix, label }: Omit<Stat, "key">) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !el) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - start) / DURATION, 1);
        setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      setShown(0);
      frame = requestAnimationFrame(tick);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      setShown(value);
    };
  }, [value]);

  return (
    <div ref={ref} className="flex flex-col-reverse gap-1.5">
      <dt className="text-sm leading-snug text-white/90">{label}</dt>
      <dd className="m-0 font-montserrat text-[40px] font-extrabold leading-none text-larioja-amarillo tabular-nums sm:text-[46px]">
        <span aria-hidden="true">
          {prefix}
          {shown}
          {suffix}
        </span>
        <span className="sr-only">
          {prefix}
          {value}
          {suffix}
        </span>
      </dd>
    </div>
  );
}

/** Franja de contadores de «Una organización que rinde cuentas». */
export function StatCounters({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return null;
  return (
    <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map(({ key, ...stat }) => (
        <StatCounter key={key} {...stat} />
      ))}
    </dl>
  );
}
