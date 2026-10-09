"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Package } from "lucide-react";
import type { Product, ProductVariant, PublicCatalog } from "@/lib/validation/products";
import { CartProvider } from "./CartProvider";
import { CartDrawer } from "./CartDrawer";
import { ProductCard } from "./ProductCard";

interface ShopCatalogProps {
  catalogs: PublicCatalog[];
  /** WhatsApp de pedidos de la tienda (solo dígitos). */
  whatsappDigits?: string;
}

/** Líneas con al menos este número de productos usan tarjetas compactas (p. ej. panadería). */
const COMPACT_FROM = 12;

/**
 * Tienda pública: selector de catálogo (taller) con su lema y «Quiénes somos»,
 * secciones por línea con su texto y eslogan, tarjetas con presentaciones y
 * canasta flotante que registra el pedido y lo envía por WhatsApp.
 */
export function ShopCatalog({ catalogs, whatsappDigits }: ShopCatalogProps) {
  const [activeSlug, setActiveSlug] = useState<string>(catalogs[0]?.slug ?? "");

  // Permite enlazar un catálogo: /productos#panaderia
  useEffect(() => {
    const fromHash = decodeURIComponent(window.location.hash.slice(1));
    if (catalogs.some((c) => c.slug === fromHash)) setActiveSlug(fromHash);
  }, [catalogs]);

  const selectCatalog = (slug: string) => {
    setActiveSlug(slug);
    window.history.replaceState(null, "", `#${slug}`);
  };

  /** Variantes a la venta (para ajustar la canasta guardada). */
  const available = useMemo(() => {
    const map = new Map<number, { product: Product; variant: ProductVariant }>();
    for (const c of catalogs)
      for (const l of c.lines)
        for (const p of l.products)
          for (const v of p.variants) map.set(v.id, { product: p, variant: v });
    return map;
  }, [catalogs]);

  const active = catalogs.find((c) => c.slug === activeSlug) ?? catalogs[0];

  if (!active) {
    return (
      <div className="py-24 md:py-32 text-center text-gray-500 dark:text-white/60">
        <Package size={64} className="mx-auto mb-6 opacity-40" />
        <p className="italic text-lg md:text-xl">
          Pronto publicaremos los productos de nuestros talleres.
        </p>
      </div>
    );
  }

  return (
    <CartProvider available={available}>
      {catalogs.length > 1 && (
        <div className="sticky top-[98px] md:top-[132px] lg:top-[140px] z-30 -mx-6 mb-10 px-6 py-3 bg-gray-50/90 dark:bg-slate-900/90 backdrop-blur-md">
          <div
            className="mx-auto flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-white dark:bg-slate-800 p-1 shadow-sm border border-gray-200 dark:border-white/10"
            role="tablist"
            aria-label="Catálogos"
          >
            {catalogs.map((c) => (
              <button
                key={c.slug}
                type="button"
                role="tab"
                aria-selected={c.slug === active.slug}
                onClick={() => selectCatalog(c.slug)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold transition-all ${
                  c.slug === active.slug
                    ? "bg-larioja-azul text-white dark:bg-larioja-amarillo dark:text-larioja-azul"
                    : "text-larioja-azul hover:bg-gray-100 dark:text-white dark:hover:bg-white/10"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div role="tabpanel" aria-label={active.name}>
        <header className="mb-10 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-larioja-azul dark:text-white">
            {active.name}
          </h2>
          {active.tagline && (
            <p className="mt-2 text-lg italic text-larioja-verde">{active.tagline}</p>
          )}
          {active.description && (
            <details className="group mt-4 text-left">
              <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-1 text-sm font-semibold text-larioja-azul/80 dark:text-white/70 hover:text-larioja-azul dark:hover:text-white [&::-webkit-details-marker]:hidden">
                Quiénes somos
                <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-gray-600 dark:text-white/70 leading-relaxed text-center whitespace-pre-line">
                {active.description}
              </p>
            </details>
          )}
        </header>

        {active.lines.length > 1 && (
          <nav
            className="mb-10 flex flex-wrap justify-center gap-2"
            aria-label="Líneas de productos"
          >
            {active.lines.map((l) => (
              <a
                key={l.id}
                href={`#linea-${l.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(`linea-${l.id}`)?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-full border border-gray-200 dark:border-white/20 bg-white dark:bg-transparent px-4 py-1.5 text-sm font-semibold text-larioja-azul dark:text-white hover:border-larioja-azul dark:hover:border-white"
              >
                {l.name}
              </a>
            ))}
          </nav>
        )}

        <div className="space-y-16">
          {active.lines.map((line) => {
            const compact = line.products.length >= COMPACT_FROM;
            return (
              <section key={line.id} id={`linea-${line.id}`} className="scroll-mt-[170px] md:scroll-mt-[204px] lg:scroll-mt-[212px]">
                <div className="mb-6 max-w-3xl">
                  <h3 className="text-2xl font-bold text-larioja-azul dark:text-white">
                    {line.name}
                  </h3>
                  {line.description && (
                    <p className="mt-2 text-gray-600 dark:text-white/70 leading-relaxed">
                      {line.description}
                    </p>
                  )}
                  {line.slogan && (
                    <p className="mt-2 font-semibold italic text-larioja-verde">{line.slogan}</p>
                  )}
                </div>
                <div
                  className={
                    compact
                      ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
                      : "grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                  }
                >
                  {line.products.map((product) => (
                    <ProductCard key={product.id} product={product} compact={compact} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <CartDrawer whatsappDigits={whatsappDigits} />
    </CartProvider>
  );
}
