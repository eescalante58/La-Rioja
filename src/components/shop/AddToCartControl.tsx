"use client";

import { Minus, Plus } from "lucide-react";
import type { Product } from "@/lib/validation/products";
import { useCart } from "@/components/products/CartProvider";

/** Máximo de unidades por producto desde la cuadrícula (especificación). */
export const MAX_PER_PRODUCT = 20;

interface AddToCartControlProps {
  product: Product;
  /** Producto con varios tamaños: el "+" abre la hoja de detalle. */
  onChooseVariant: () => void;
  /** Se llama al agregar (para el aviso "Agregado a la canasta"). */
  onAdded: (productName: string) => void;
}

/**
 * Amplía el área táctil de un botón de 34-38 px a ≥ 44 px sin cambiar su
 * tamaño visual (pseudo-elemento transparente alrededor). El botón debe estar
 * posicionado: los circulares ya son `absolute`; los del contador usan
 * `TOUCH_IN_FLOW` (no combinar `relative` con `absolute`: gana `relative`).
 */
const TOUCH = "after:absolute after:-inset-[5px] after:content-['']";
const TOUCH_IN_FLOW = `relative ${TOUCH}`;

/**
 * Botón "+" sobre la foto de la tarjeta. Sin variantes agrega 1 unidad y se
 * transforma en el contador "− N +" (máx. `MAX_PER_PRODUCT`); "−" con 1
 * unidad quita el producto y vuelve a "+". Con variantes abre la hoja de
 * detalle para elegir el tamaño (no agrega directamente).
 */
export function AddToCartControl({ product, onChooseVariant, onAdded }: AddToCartControlProps) {
  const { add, setQuantity, quantityOf } = useCart();
  const hasVariants = product.variants.length > 1;
  const variant = product.variants[0];
  const qty = hasVariants || !variant ? 0 : quantityOf(variant.id);

  const position = "absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2";
  const circle =
    "flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[var(--shop-action)] text-white shadow-md sm:h-[38px] sm:w-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shop-focus)] focus-visible:ring-offset-2";

  if (hasVariants || !variant) {
    return (
      <button
        type="button"
        onClick={onChooseVariant}
        aria-label={`Elegir tamaño de ${product.name}`}
        className={`${position} ${circle} ${TOUCH}`}
      >
        <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
      </button>
    );
  }

  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={() => {
          add(product, variant);
          onAdded(product.name);
        }}
        aria-label={`Agregar ${product.name} a la canasta`}
        className={`${position} ${circle} ${TOUCH}`}
      >
        <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      className={`${position} flex h-[34px] items-center rounded-full bg-[var(--shop-action)] text-white shadow-md transition-[width] duration-[180ms] motion-reduce:transition-none sm:h-[38px]`}
      role="group"
      aria-label={`Cantidad de ${product.name} en la canasta`}
    >
      <button
        type="button"
        onClick={() => setQuantity(variant.id, qty - 1)}
        aria-label="Quitar uno"
        className={`flex h-full w-[34px] items-center justify-center rounded-full sm:w-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shop-focus)] ${TOUCH_IN_FLOW}`}
      >
        <Minus size={18} strokeWidth={2.5} aria-hidden="true" />
      </button>
      <span className="min-w-[1.5ch] text-center text-sm font-semibold" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        onClick={() => {
          add(product, variant);
          onAdded(product.name);
        }}
        disabled={qty >= MAX_PER_PRODUCT}
        aria-label="Agregar uno"
        className={`flex h-full w-[34px] items-center justify-center rounded-full disabled:opacity-40 sm:w-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shop-focus)] ${TOUCH_IN_FLOW}`}
      >
        <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  );
}
