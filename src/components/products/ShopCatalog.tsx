"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Download, Package } from "lucide-react";
import {
  formatBytes,
  type Product,
  type ProductVariant,
  type PublicCatalog,
} from "@/lib/validation/products";
import { CartProvider } from "./CartProvider";
import { CartDrawer } from "./CartDrawer";
import { ShopNav } from "@/components/shop/ShopNav";
import { ProductLine } from "@/components/shop/ProductLine";
import { ProductSheet } from "@/components/shop/ProductSheet";

interface ShopCatalogProps {
  catalogs: PublicCatalog[];
  /** WhatsApp de pedidos de la tienda (solo dígitos). */
  whatsappDigits?: string;
}

/** Producto con el taller al que pertenece (para abrirlo desde la URL). */
interface IndexedProduct {
  product: Product;
  catalogSlug: string;
}

/** Imágenes con prioridad: las primeras visibles al cargar (especificación). */
const PRIORITY_IMAGES = 4;

/** Duración del aviso "Agregado a la canasta". */
const TOAST_MS = 2000;

/** URL actual con `?producto=` cambiado (o quitado) conservando el `#taller`. */
function urlWithProduct(slug: string | null): string {
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set("producto", slug);
  else url.searchParams.delete("producto");
  return `${url.pathname}${url.search}${url.hash}`;
}

interface SheetFromUrlProps {
  index: Map<string, IndexedProduct>;
  onShowCatalog: (slug: string) => void;
  onClose: () => void;
  onAdded: (name: string) => void;
}

/**
 * Lee `?producto=` y muestra la hoja de detalle. Va dentro de `<Suspense>`
 * porque `useSearchParams` en una página ISR se resuelve en el cliente.
 * Si el producto es de otro taller, cambia el taller activo.
 */
function SheetFromUrl({ index, onShowCatalog, onClose, onAdded }: SheetFromUrlProps) {
  const params = useSearchParams();
  const slug = params.get("producto");
  const entry = slug ? index.get(slug) : undefined;

  useEffect(() => {
    if (entry) onShowCatalog(entry.catalogSlug);
  }, [entry, onShowCatalog]);

  return <ProductSheet product={entry?.product ?? null} onClose={onClose} onAdded={onAdded} />;
}

/**
 * Tienda pública (rediseño "Cuadrícula de productos"): navegación fija con
 * canasta, talleres y líneas; encabezado del taller (lema, «Quiénes somos»,
 * catálogo PDF); una cuadrícula de 2-5 columnas por línea; hoja de detalle
 * enlazable con `?producto=<slug>` y canasta que envía el pedido por WhatsApp.
 */
export function ShopCatalog({ catalogs, whatsappDigits }: ShopCatalogProps) {
  const [activeSlug, setActiveSlug] = useState<string>(catalogs[0]?.slug ?? "");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Elemento que abrió la hoja (recibe el foco al cerrarla). */
  const triggerRef = useRef<HTMLElement | null>(null);
  /** true si la hoja se abrió desde la tienda (cerrar = volver atrás). */
  const openedInApp = useRef(false);

  // Permite enlazar un catálogo: /productos#panaderia
  useEffect(() => {
    const fromHash = decodeURIComponent(window.location.hash.slice(1));
    if (catalogs.some((c) => c.slug === fromHash)) setActiveSlug(fromHash);
  }, [catalogs]);

  const selectCatalog = useCallback((slug: string) => {
    setActiveSlug(slug);
    const url = new URL(window.location.href);
    url.hash = slug;
    window.history.replaceState(window.history.state, "", url.toString());
  }, []);

  /** Variantes a la venta (para ajustar la canasta guardada). */
  const available = useMemo(() => {
    const map = new Map<number, { product: Product; variant: ProductVariant }>();
    for (const c of catalogs)
      for (const l of c.lines)
        for (const p of l.products)
          for (const v of p.variants) map.set(v.id, { product: p, variant: v });
    return map;
  }, [catalogs]);

  /** Productos por slug, para abrir la hoja desde la URL. */
  const index = useMemo(() => {
    const map = new Map<string, IndexedProduct>();
    for (const c of catalogs)
      for (const l of c.lines)
        for (const p of l.products) map.set(p.slug, { product: p, catalogSlug: c.slug });
    return map;
  }, [catalogs]);

  const announce = useCallback((name: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(`${name}: agregado a la canasta`);
    toastTimer.current = setTimeout(() => setToast(""), TOAST_MS);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  /** Abre la hoja (pushState: sin pedir la página al servidor). */
  const openProduct = useCallback((product: Product, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    openedInApp.current = true;
    window.history.pushState(window.history.state, "", urlWithProduct(product.slug));
  }, []);

  /** Cierra la hoja y devuelve el foco a la tarjeta que la abrió. */
  const closeProduct = useCallback(() => {
    if (openedInApp.current) {
      openedInApp.current = false;
      window.history.back();
    } else {
      window.history.replaceState(window.history.state, "", urlWithProduct(null));
    }
    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (trigger) setTimeout(() => trigger.focus({ preventScroll: true }), 0);
  }, []);

  const active = catalogs.find((c) => c.slug === activeSlug) ?? catalogs[0];

  if (!active) {
    return (
      <div className="py-24 text-center text-[var(--shop-text-3)] md:py-32">
        <Package size={64} className="mx-auto mb-6 opacity-40" aria-hidden="true" />
        <p className="text-lg italic md:text-xl">
          Pronto publicaremos los productos de nuestros talleres.
        </p>
      </div>
    );
  }

  return (
    <CartProvider available={available}>
      <ShopNav
        catalogs={catalogs}
        activeSlug={active.slug}
        onSelectCatalog={selectCatalog}
        lines={active.lines}
      />

      <div role="tabpanel" aria-label={active.name}>
        <header className="mx-auto mb-6 max-w-3xl text-center sm:mb-8">
          <h2 className="font-montserrat text-2xl font-medium text-[var(--shop-text)] sm:text-3xl">
            {active.name}
          </h2>
          {active.tagline && (
            <p className="mt-1 text-sm italic text-larioja-verde dark:text-green-400 sm:text-base">
              {active.tagline}
            </p>
          )}
          {active.description && (
            <details className="group mt-2 text-left">
              <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-1 text-[13px] font-medium text-[var(--shop-text-3)] hover:text-[var(--shop-text)] sm:text-sm [&::-webkit-details-marker]:hidden">
                Quiénes somos
                <ChevronDown
                  size={16}
                  className="transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-2 whitespace-pre-line text-center text-sm leading-relaxed text-[var(--shop-text-3)]">
                {active.description}
              </p>
            </details>
          )}
          {active.pdf_url && (
            <a
              href={`${active.pdf_url}?download=${encodeURIComponent(`Catálogo ${active.name}.pdf`)}`}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--shop-chip-line)] px-4 text-[13px] font-medium text-[var(--shop-text)] hover:bg-[var(--shop-chip-line)] sm:text-sm"
            >
              <Download size={16} aria-hidden="true" />
              Descargar catálogo
              {active.pdf_size_bytes ? (
                <span className="font-normal text-[var(--shop-text-3)]">
                  (PDF · {formatBytes(active.pdf_size_bytes)})
                </span>
              ) : null}
            </a>
          )}
        </header>

        <div className="space-y-10 sm:space-y-14">
          {active.lines.map((line, i) => (
            <ProductLine
              key={line.id}
              line={line}
              priorityCount={i === 0 ? PRIORITY_IMAGES : 0}
              onOpen={openProduct}
              onAdded={announce}
            />
          ))}
        </div>
      </div>

      <Suspense fallback={null}>
        <SheetFromUrl
          index={index}
          onShowCatalog={setActiveSlug}
          onClose={closeProduct}
          onAdded={announce}
        />
      </Suspense>

      {/* Aviso "Agregado a la canasta" (anunciado a lectores de pantalla). */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[126] flex justify-center px-4"
      >
        {toast && (
          <p className="rounded-full bg-[#012060] px-4 py-2.5 text-sm font-medium text-white shadow-lg ring-1 ring-white/20 motion-safe:animate-[fadeIn_150ms_ease-out]">
            {toast}
          </p>
        )}
      </div>

      <CartDrawer whatsappDigits={whatsappDigits} />
    </CartProvider>
  );
}
