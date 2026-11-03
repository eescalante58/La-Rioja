"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingBasket } from "lucide-react";
import type { ProductLine, PublicCatalog } from "@/lib/validation/products";
import { usd } from "@/lib/validation/shop-orders";
import { useCart } from "@/components/products/CartProvider";

interface ShopNavProps {
  catalogs: PublicCatalog[];
  activeSlug: string;
  onSelectCatalog: (slug: string) => void;
  /** Líneas del taller activo (el nivel 2 se oculta si hay una sola). */
  lines: ProductLine[];
}

/** Separación entre la barra fija y el inicio de la línea al desplazarse. */
const SCROLL_GAP = 8;

/**
 * Borde inferior de la barra **cuando está fija** (su `top` sticky más su
 * alto). No se usa su posición actual: antes de fijarse está más abajo y
 * los cálculos de desplazamiento quedarían corridos.
 * @param nav Contenedor sticky de la barra.
 * @returns Píxeles desde el borde superior de la ventana.
 */
function stuckBottom(nav: HTMLElement): number {
  return (parseFloat(getComputedStyle(nav).top) || 0) + nav.offsetHeight;
}

/**
 * Botón circular de la canasta (44 px) con el contador en amarillo.
 * Abre el panel de la canasta existente (`CartDrawer`).
 */
function ShopCartButton() {
  const cart = useCart();
  const empty = cart.count === 0;
  return (
    <button
      type="button"
      onClick={cart.open}
      aria-label={
        empty
          ? "Canasta vacía"
          : `Ver canasta: ${cart.count} ${cart.count === 1 ? "producto" : "productos"}, ${usd.format(cart.total)}`
      }
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--shop-chip-line)] bg-[var(--shop-tile)] text-[#012060] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shop-focus)]"
    >
      <ShoppingBasket size={20} aria-hidden="true" />
      {!empty && (
        <span className="absolute -right-1 -top-1 min-w-[1.25rem] rounded-full bg-larioja-amarillo px-1 text-center text-[11px] font-bold leading-5 text-[#012060]">
          {cart.count}
        </span>
      )}
    </button>
  );
}

/**
 * Navegación fija de la tienda bajo el encabezado del sitio, en dos niveles:
 * 1) canasta + chips de taller (44 px); 2) chips de línea (32 px) con scroll
 * horizontal. El chip de línea activo sigue el scroll (IntersectionObserver)
 * y se centra en la barra; tocarlo desplaza la página hasta esa línea.
 * Publica su borde inferior en `--shop-scroll-offset` para los anclajes.
 */
export function ShopNav({ catalogs, activeSlug, onSelectCatalog, lines }: ShopNavProps) {
  const navRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [activeLine, setActiveLine] = useState<number | null>(lines[0]?.id ?? null);
  const [tabEdges, setTabEdges] = useState<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });
  const showLines = lines.length > 1;

  // Borde inferior de la barra → scroll-margin-top de las líneas.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const publish = () => {
      document.documentElement.style.setProperty(
        "--shop-scroll-offset",
        `${Math.round(stuckBottom(nav) + SCROLL_GAP)}px`,
      );
    };
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(nav);
    window.addEventListener("resize", publish);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", publish);
    };
  }, [showLines]);

  // Línea activa según el scroll: la primera que cruza el borde de la barra.
  useEffect(() => {
    setActiveLine(lines[0]?.id ?? null);
    if (!showLines || !navRef.current) return;
    const navBottom = stuckBottom(navRef.current);
    const sections = lines
      .map((l) => document.getElementById(`linea-${l.id}`))
      .filter((el): el is HTMLElement => el !== null);
    const visible = new Map<number, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = Number((entry.target as HTMLElement).dataset.lineId);
          if (entry.isIntersecting) visible.set(id, entry.boundingClientRect.top);
          else visible.delete(id);
        }
        const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0];
        if (top) setActiveLine(top[0]);
      },
      { rootMargin: `-${Math.round(navBottom)}px 0px -55% 0px` },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [lines, showLines]);

  // Centra la pestaña del taller activo dentro de la barra si hubiese desborde (4+ talleres).
  useEffect(() => {
    const bar = tabsRef.current;
    const tab = bar?.querySelector<HTMLElement>(`[data-catalog-tab="${activeSlug}"]`);
    if (!bar || !tab) return;
    if (bar.scrollWidth > bar.clientWidth + 1) {
      const left = tab.offsetLeft - (bar.clientWidth - tab.clientWidth) / 2;
      bar.scrollTo({ left, behavior: "smooth" });
    } else if (bar.scrollLeft !== 0) {
      bar.scrollTo({ left: 0, behavior: "auto" });
    }
  }, [activeSlug]);

  // Detecta desborde horizontal en la barra de talleres para mostrar degradados laterales (4+ talleres).
  useEffect(() => {
    const bar = tabsRef.current;
    if (!bar) return;
    const updateEdges = () => {
      const overflows = bar.scrollWidth > bar.clientWidth + 1;
      setTabEdges({
        left: overflows && bar.scrollLeft > 1,
        right: overflows && bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 1,
      });
    };
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(bar);
    bar.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      observer.disconnect();
      bar.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [catalogs.length]);

  // Centra el chip activo dentro de la barra (sin mover la página).
  useEffect(() => {
    const bar = chipsRef.current;
    const chip = bar?.querySelector<HTMLElement>(`[data-chip="${activeLine}"]`);
    if (!bar || !chip) return;
    if (bar.scrollWidth > bar.clientWidth + 1) {
      const left = chip.offsetLeft - (bar.clientWidth - chip.clientWidth) / 2;
      bar.scrollTo({ left, behavior: "smooth" });
    } else if (bar.scrollLeft !== 0) {
      bar.scrollTo({ left: 0, behavior: "auto" });
    }
  }, [activeLine]);

  /**
   * Cuando el taller tiene 2 o 3 líneas (p. ej. Navidad 2026: «Costura navideña»,
   * «Madera y decoración» y «Galletas navideñas»), en móvil (< sm) los chips se
   * reparten el ancho útil completo sin desborde ni recorte lateral.
   */
  const splitLinesOnMobile = lines.length > 1 && lines.length <= 3;

  /** Desplaza la página hasta la línea, dejando la barra fija a la vista. */
  const goToLine = (id: number) => {
    const section = document.getElementById(`linea-${id}`);
    const nav = navRef.current;
    if (!section || !nav) return;
    const offset = stuckBottom(nav) + SCROLL_GAP;
    const top = section.getBoundingClientRect().top + window.scrollY - offset;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    setActiveLine(id);
  };

  return (
    <div
      ref={navRef}
      className="sticky top-nav z-30 -mx-3 mb-4 border-b border-[var(--shop-chip-line)] bg-[var(--shop-bg)] px-3 py-2 sm:-mx-6 sm:mb-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      <div className="flex items-center gap-2">
        <ShopCartButton />
        {catalogs.length > 1 && (
          <div className="relative flex min-w-0 flex-1 sm:flex-none">
            <div
              ref={tabsRef}
              className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto snap-x snap-proximity [scrollbar-width:none] sm:flex-none sm:gap-2 [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Talleres"
            >
              {catalogs.map((c) => {
                const active = c.slug === activeSlug;
                const badge = c.badge ?? (c.slug.startsWith("navidad") ? "Temporada" : null);
                return (
                  <button
                    key={c.slug}
                    type="button"
                    role="tab"
                    data-catalog-tab={c.slug}
                    aria-selected={active}
                    onClick={() => onSelectCatalog(c.slug)}
                    className={`shop-tab-label flex h-11 min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 rounded-full px-1.5 text-center text-[12px] leading-tight [text-wrap:balance] snap-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shop-focus)] sm:inline-flex sm:flex-none sm:shrink-0 sm:flex-row sm:gap-1.5 sm:whitespace-nowrap sm:px-4 sm:text-sm ${
                      active
                        ? "bg-[#0056b3] font-semibold text-white dark:bg-[#ffff00] dark:text-[#012060]"
                        : "border border-[var(--shop-chip-line)] font-medium text-[var(--shop-text)] transition-colors hover:bg-[var(--shop-chip-line)]"
                    }`}
                  >
                    <span className="max-w-full [text-wrap:balance]">{c.name}</span>
                    {badge && (
                      <span className="rounded-full bg-[#9b1c2e] px-1.5 py-[1px] text-[8.5px] font-bold leading-none text-white sm:py-0.5 sm:text-[9.5px]">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {tabEdges.left && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-[var(--shop-bg)] to-transparent"
              />
            )}
            {tabEdges.right && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-[var(--shop-bg)] to-transparent"
              />
            )}
          </div>
        )}
      </div>

      {showLines && (
        <nav aria-label="Líneas de productos" className="mt-2">
          <div
            ref={chipsRef}
            className={
              splitLinesOnMobile
                ? "flex min-w-0 gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] sm:-mx-1 sm:px-1 [&::-webkit-scrollbar]:hidden"
                : "-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            }
          >
            {lines.map((l) => {
              const active = l.id === activeLine;
              return (
                <a
                  key={l.id}
                  href={`#linea-${l.id}`}
                  data-chip={l.id}
                  aria-current={active ? "true" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    goToLine(l.id);
                  }}
                  className={`${
                    splitLinesOnMobile
                      ? "shop-tab-label flex min-h-9 min-w-0 flex-1 basis-0 items-center justify-center rounded-full px-2 py-1 text-center text-[12px] leading-tight [text-wrap:balance] sm:h-8 sm:min-h-0 sm:flex-none sm:shrink-0 sm:whitespace-nowrap sm:px-3 sm:py-0 sm:text-[13px]"
                      : "flex h-8 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-[13px]"
                  } transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shop-focus)] ${
                    active
                      ? "bg-[var(--shop-chip-line)] font-medium text-[var(--shop-text)]"
                      : "text-[var(--shop-text-3)] hover:text-[var(--shop-text)]"
                  }`}
                >
                  {l.name}
                </a>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
