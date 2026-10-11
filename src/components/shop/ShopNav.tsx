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
  const chipsRef = useRef<HTMLDivElement>(null);
  const [activeLine, setActiveLine] = useState<number | null>(lines[0]?.id ?? null);
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

  // Centra el chip activo dentro de la barra (sin mover la página).
  useEffect(() => {
    const bar = chipsRef.current;
    const chip = bar?.querySelector<HTMLElement>(`[data-chip="${activeLine}"]`);
    if (!bar || !chip) return;
    const left = chip.offsetLeft - (bar.clientWidth - chip.clientWidth) / 2;
    bar.scrollTo({ left, behavior: "smooth" });
  }, [activeLine]);

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
      className="sticky top-[98px] z-30 -mx-3 mb-4 border-b border-[var(--shop-chip-line)] bg-[var(--shop-bg)] px-3 py-2 sm:-mx-6 sm:mb-6 sm:px-6 md:top-[132px] lg:-mx-8 lg:top-[140px] lg:px-8"
    >
      <div className="flex items-center gap-2">
        <ShopCartButton />
        {catalogs.length > 1 && (
          // En celular los talleres se reparten el ancho y el nombre puede ir en
          // dos líneas (con el zoom de Safari no cabe en una).
          <div
            className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none] sm:flex-none [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Talleres"
          >
            {catalogs.map((c) => {
              const active = c.slug === activeSlug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectCatalog(c.slug)}
                  className={`h-11 min-w-[6.5rem] flex-1 rounded-full px-3 text-[13px] font-medium leading-tight [text-wrap:balance] sm:flex-none sm:shrink-0 sm:whitespace-nowrap sm:px-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shop-focus)] sm:text-sm ${
                    active
                      ? "bg-[var(--shop-chip-active)] text-[var(--shop-chip-active-text)]"
                      : "border border-[var(--shop-chip-line)] text-[var(--shop-text)] hover:bg-[var(--shop-chip-line)]"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showLines && (
        <nav aria-label="Líneas de productos" className="mt-2">
          <div
            ref={chipsRef}
            className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                  className={`flex h-8 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shop-focus)] ${
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
