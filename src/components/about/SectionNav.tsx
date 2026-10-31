"use client";

import { useEffect, useRef, useState } from "react";

/** Enlace de la barra de secciones. */
export interface SectionLink {
  /** `id` de la sección (sin `#`). */
  id: string;
  label: string;
}

interface SectionNavProps {
  links: SectionLink[];
}

/**
 * Barra de anclas de Nosotros, fija bajo la navbar. Marca con `aria-current`
 * la sección visible (IntersectionObserver) y centra su chip en la barra,
 * que se desplaza en horizontal en celular. No hace llamadas al servidor.
 */
export function SectionNav({ links }: SectionNavProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);

  // Sección activa: la última sección en el orden del documento que cruza la franja de lectura.
  useEffect(() => {
    const sections = links
      .map((l) => document.getElementById(l.id))
      .filter((el): el is HTMLElement => el !== null);
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        // Selecciona la última sección activa según el orden del recorrido
        const activeId = links
          .map((l) => l.id)
          .reverse()
          .find((id) => visible.has(id));

        setActive(activeId || null);
      },
      { rootMargin: "-130px 0px -60% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [links]);

  // Centra el chip activo dentro de la barra (sin mover la página).
  useEffect(() => {
    const bar = barRef.current;
    const chip = bar?.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (!bar || !chip) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bar.scrollTo({
      left: chip.offsetLeft - (bar.clientWidth - chip.clientWidth) / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [active]);

  if (links.length === 0) return null;

  return (
    <nav
      aria-label="Secciones de la página"
      className="sticky top-nav z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 dark:bg-larioja-azul/95 dark:supports-[backdrop-filter]:bg-larioja-azul/85"
    >
      <div
        ref={barRef}
        className="mx-auto flex w-full max-w-screen-xl gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {links.map((l) => {
          const current = l.id === active;
          return (
            <a
              key={l.id}
              href={`#${l.id}`}
              data-chip={l.id}
              aria-current={current ? "location" : undefined}
              className={`flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-full px-4 font-montserrat text-sm font-semibold no-underline transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul-enlace dark:focus-visible:outline-larioja-amarillo ${
                current
                  ? "bg-larioja-azul text-white dark:bg-larioja-amarillo dark:text-larioja-azul"
                  : "text-larioja-azul hover:bg-[#F3F5F8] dark:text-white dark:hover:bg-white/10"
              }`}
            >
              {l.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
