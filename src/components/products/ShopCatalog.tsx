"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/** `?producto=` de la URL actual (o null). */
function productFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get("producto");
}

/** Determina si un catálogo corresponde al catálogo de temporada. */
function isSeasonalCatalog(c: { slug: string; badge?: string | null }): boolean {
  return (
    c.slug === "temporada" ||
    c.slug.startsWith("navidad") ||
    Boolean(c.badge && c.badge.toLowerCase().includes("temporada")) ||
    (c.slug !== "arte-y-costura" && c.slug !== "panaderia")
  );
}

/** Nombre del ancla pública para un catálogo (`temporada` para el catálogo estacional). */
function anchorForCatalog(c: { slug: string; badge?: string | null }): string {
  return isSeasonalCatalog(c) ? "temporada" : c.slug;
}

/**
 * Resuelve un valor de ancla o parámetro (`temporada`, `navidad-2026`, `arte-y-costura`, etc.)
 * al `slug` real del catálogo activo correspondiente.
 */
function resolveCatalogSlug(raw: string | null, catalogs: PublicCatalog[]): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  const exact = catalogs.find((c) => c.slug.toLowerCase() === key);
  if (exact) return exact.slug;
  if (key === "temporada" || key.startsWith("navidad")) {
    const seasonal = catalogs.find(isSeasonalCatalog);
    if (seasonal) return seasonal.slug;
  }
  return null;
}

/**
 * Obtiene el slug del catálogo solicitado en la URL (`?taller=temporada`, `?catalogo=...`
 * o el hash `#temporada` / `#<slug>`), si coincide con alguno de los catálogos activos.
 */
function catalogSlugFromUrl(catalogs: PublicCatalog[]): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const fromQuery = resolveCatalogSlug(params.get("taller") ?? params.get("catalogo"), catalogs);
  if (fromQuery) return fromQuery;
  const fromHash = resolveCatalogSlug(decodeURIComponent(window.location.hash.slice(1)), catalogs);
  if (fromHash) return fromHash;
  return null;
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
  /**
   * Producto abierto en la hoja (`?producto=`). Es estado local sincronizado
   * con la URL mediante history.pushState/popstate: no depende del router de
   * Next ni de `useSearchParams`, así la página sigue siendo estática (ISR).
   */
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  // `?producto=` al cargar (enlace compartido) y botón Atrás/Adelante.
  useEffect(() => {
    setOpenSlug(productFromUrl());
    const onPopState = () => {
      openedInApp.current = false;
      setOpenSlug(productFromUrl());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Permite enlazar un catálogo desde otras áreas del sitio: /productos#temporada o /productos?taller=temporada
  useEffect(() => {
    const applyTargetCatalog = (slug: string, scroll: boolean) => {
      setActiveSlug(slug);
      const matched = catalogs.find((c) => c.slug === slug);
      const anchor = matched ? anchorForCatalog(matched) : slug;
      // Asegura que el hash refleje el ancla oficial (#temporada para el catálogo estacional)
      if (window.location.hash !== `#${anchor}`) {
        const url = new URL(window.location.href);
        url.hash = anchor;
        window.history.replaceState(window.history.state, "", url.toString());
      }
      if (scroll) {
        requestAnimationFrame(() => {
          const target =
            document.getElementById(anchor) ??
            document.getElementById(slug) ??
            document.getElementById("catalogo");
          if (target) {
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
          }
        });
      }
    };

    const syncFromLocation = (scroll: boolean) => {
      const targetSlug = catalogSlugFromUrl(catalogs);
      if (!targetSlug) return false;
      applyTargetCatalog(targetSlug, scroll);
      return true;
    };

    if (!syncFromLocation(true)) {
      // En iOS/Safari con <Link href="/productos#temporada"> de Next.js App Router, el hash
      // puede asentarse en el siguiente tick tras la transición; verificamos de nuevo.
      const retryTimers = [50, 180, 400].map((ms) =>
        setTimeout(() => {
          syncFromLocation(true);
        }, ms),
      );
      const onHashOrPop = () => {
        syncFromLocation(true);
      };
      window.addEventListener("hashchange", onHashOrPop);
      window.addEventListener("popstate", onHashOrPop);
      return () => {
        retryTimers.forEach(clearTimeout);
        window.removeEventListener("hashchange", onHashOrPop);
        window.removeEventListener("popstate", onHashOrPop);
      };
    }

    const onHashOrPop = () => {
      syncFromLocation(true);
    };
    window.addEventListener("hashchange", onHashOrPop);
    window.addEventListener("popstate", onHashOrPop);
    return () => {
      window.removeEventListener("hashchange", onHashOrPop);
      window.removeEventListener("popstate", onHashOrPop);
    };
  }, [catalogs]);

  const selectCatalog = useCallback(
    (slug: string) => {
      setActiveSlug(slug);
      const matched = catalogs.find((c) => c.slug === slug);
      const anchor = matched ? anchorForCatalog(matched) : slug;
      const url = new URL(window.location.href);
      url.searchParams.delete("taller");
      url.searchParams.delete("catalogo");
      url.hash = anchor;
      window.history.replaceState(window.history.state, "", url.toString());
    },
    [catalogs],
  );

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
    setOpenSlug(product.slug);
  }, []);

  /** Cierra la hoja y devuelve el foco a la tarjeta que la abrió. */
  const closeProduct = useCallback(() => {
    setOpenSlug(null);
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

  const openEntry = openSlug ? index.get(openSlug) : undefined;

  // Un enlace a un producto de otro taller cambia el taller activo.
  useEffect(() => {
    if (openEntry) setActiveSlug(openEntry.catalogSlug);
  }, [openEntry]);

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
      {/* Anclas DOM por cada catálogo activo para permitir enlaces directos (#temporada, #arte-y-costura, etc.) desde cualquier área del sitio */}
      <div aria-hidden="true" className="relative">
        {catalogs.map((c) => {
          const anchor = anchorForCatalog(c);
          return (
            <span key={c.slug} id={anchor} className="block scroll-mt-nav">
              {anchor !== c.slug && <span id={c.slug} className="block scroll-mt-nav" />}
            </span>
          );
        })}
      </div>

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

      <ProductSheet
        product={openEntry?.product ?? null}
        onClose={closeProduct}
        onAdded={announce}
      />

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
