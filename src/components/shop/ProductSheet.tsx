"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { Minus, Package, Plus, X } from "lucide-react";
import type { Product } from "@/lib/validation/products";
import { useCart } from "@/components/products/CartProvider";
import { MAX_PER_PRODUCT } from "./AddToCartControl";
import { Price } from "./Price";

interface ProductSheetProps {
  /** Producto abierto (o null si la hoja está cerrada). */
  product: Product | null;
  onClose: () => void;
  onAdded: (productName: string) => void;
}

/** Arrastre hacia abajo (px) a partir del cual la hoja se cierra en celular. */
const DRAG_CLOSE = 110;

/** Elementos que pueden recibir foco dentro de la hoja (para atraparlo). */
const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Hoja de detalle del producto. En celular es una hoja inferior al 90 % del
 * alto que se cierra arrastrando hacia abajo; desde 640 px es un modal
 * centrado de hasta 720 px en dos columnas. Muestra foto, nombre, precio,
 * descripción, selector de tamaño (precio actualizado), cantidad y "Agregar
 * a la canasta". Se cierra con la X, Escape o tocando fuera; atrapa el foco
 * mientras está abierta (el foco vuelve a la tarjeta desde `ShopCatalog`).
 */
export function ProductSheet({ product, onClose, onAdded }: ProductSheetProps) {
  const { add } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dragStart = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);

  const variants = product?.variants ?? [];
  const firstAvailable = variants.find((v) => v.is_available) ?? variants[0];
  const variant = variants.find((v) => v.id === variantId) ?? firstAvailable;
  const hasVariants = variants.length > 1;
  const soldOut = !variant || !variant.is_available;

  // Al abrir otro producto: tamaño por defecto, cantidad 1 y foco en cerrar.
  useEffect(() => {
    if (!product) return;
    setVariantId(null);
    setQty(1);
    setDragY(0);
    closeRef.current?.focus();
  }, [product]);

  // Bloquea el scroll de la página mientras la hoja está abierta.
  useEffect(() => {
    if (!product) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [product]);

  // Escape cierra; Tab queda atrapado dentro de la hoja.
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [product, onClose]);

  if (!product) return null;

  /** Arrastre para cerrar (solo desde la barra superior de la hoja). */
  const onDragStart = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStart.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    setDragY(Math.max(0, e.clientY - dragStart.current));
  };
  const onDragEnd = () => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    if (dragY > DRAG_CLOSE) onClose();
    else setDragY(0);
  };

  const addToCart = () => {
    if (!variant || soldOut) return;
    add(product, variant, qty);
    onAdded(product.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[125] flex items-end justify-center sm:items-center sm:p-6">
      {/* Fondo: tocar fuera cierra. */}
      <div
        className="absolute inset-0 bg-black/55 motion-safe:animate-[fadeIn_200ms_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-sheet-title"
        style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
        className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white text-[#012060] shadow-2xl motion-safe:animate-[sheetUp_240ms_ease-out] dark:bg-[#0f2a55] dark:text-white sm:max-w-[720px] sm:rounded-3xl sm:motion-safe:animate-[fadeIn_200ms_ease-out]"
      >
        {/* Barra superior: asa de arrastre (celular) y botón cerrar. */}
        <div
          className="flex shrink-0 touch-none items-center justify-between px-4 pb-1 pt-2 sm:pt-3"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <span
            className="mx-auto h-1.5 w-10 rounded-full bg-black/15 dark:bg-white/25 sm:invisible"
            aria-hidden="true"
          />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Cerrar detalle"
            className="absolute right-2 top-1.5 flex h-11 w-11 items-center justify-center rounded-full opacity-80 hover:bg-black/5 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shop-focus)] dark:hover:bg-white/10"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:grid sm:grid-cols-2 sm:gap-6 sm:px-6 sm:pb-6">
          <div className="relative mx-auto aspect-square w-full max-w-[360px] overflow-hidden rounded-2xl bg-[var(--shop-tile)]">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                quality={75}
                sizes="(max-width: 639px) 90vw, 360px"
                className={`object-contain p-[6%] ${soldOut ? "opacity-50" : ""}`}
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[#5A6782]/40">
                <Package size={64} aria-hidden="true" />
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:mt-0">
            <h2
              id="product-sheet-title"
              className="pr-10 font-montserrat text-xl font-medium leading-snug"
            >
              {product.name}
            </h2>
            {variant && <Price value={variant.price} unit={variant.unit} size="sheet" />}
            {product.description && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-[#5A6782] dark:text-white/70">
                {product.description}
              </p>
            )}

            {hasVariants && (
              <div role="radiogroup" aria-label="Tamaño" className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const selected = v.id === variant?.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={!v.is_available}
                      onClick={() => setVariantId(v.id)}
                      className={`h-11 min-w-[6rem] rounded-xl border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shop-focus)] disabled:cursor-not-allowed disabled:line-through disabled:opacity-50 ${
                        selected
                          ? "border-[var(--shop-action)] bg-[var(--shop-action)] text-white"
                          : "border-black/15 hover:border-[var(--shop-action)] dark:border-white/25"
                      }`}
                    >
                      {v.label ?? "Única"}
                    </button>
                  );
                })}
              </div>
            )}

            {soldOut ? (
              <p className="rounded-xl bg-black/5 px-4 py-3 text-center text-sm font-medium dark:bg-white/10">
                Agotado
              </p>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#5A6782] dark:text-white/70">Cantidad</span>
                  <div className="flex items-center rounded-full border border-black/15 dark:border-white/25">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      aria-label="Quitar uno"
                      className="flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shop-focus)]"
                    >
                      <Minus size={18} aria-hidden="true" />
                    </button>
                    <span className="min-w-[2ch] text-center font-medium" aria-live="polite">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(MAX_PER_PRODUCT, q + 1))}
                      disabled={qty >= MAX_PER_PRODUCT}
                      aria-label="Agregar uno"
                      className="flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shop-focus)]"
                    >
                      <Plus size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addToCart}
                  className="h-[52px] w-full rounded-xl bg-[var(--shop-action)] text-base font-medium text-white hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shop-focus)] focus-visible:ring-offset-2"
                >
                  Agregar a la canasta
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
