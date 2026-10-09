"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Product, ProductVariant } from "@/lib/validation/products";

/** Línea de la canasta: variante + datos para mostrarla sin volver a consultar. */
export interface CartLine {
  variantId: number;
  productName: string;
  variantLabel: string | null;
  unit: string | null;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  total: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  quantityOf: (variantId: number) => number;
  add: (product: Product, variant: ProductVariant, quantity?: number) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "larioja-shop-cart-v1";
const MAX_QTY = 999;

/** Lee la canasta guardada (puede no existir o estar bloqueado el storage). */
function readStored(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

interface CartProviderProps {
  /** Variantes a la venta: la canasta guardada se ajusta a ellas (precio/nombre vigentes). */
  available: Map<number, { product: Product; variant: ProductVariant }>;
  children: ReactNode;
}

/**
 * Canasta de La Rioja Shop. Se guarda en `localStorage` solo como comodidad
 * del visitante; el precio real lo recalcula el RPC `create_shop_order`.
 */
export function CartProvider({ available, children }: CartProviderProps) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Restaura la canasta y la ajusta al catálogo vigente (quita lo que ya no
  // está a la venta y actualiza precios/nombres).
  useEffect(() => {
    const restored = readStored().flatMap((l) => {
      const match = available.get(l.variantId);
      if (!match || !match.variant.is_available) return [];
      return [
        {
          ...l,
          productName: match.product.name,
          variantLabel: match.variant.label,
          unit: match.variant.unit,
          price: match.variant.price,
          imageUrl: match.product.image_url,
          quantity: Math.min(Math.max(1, Math.floor(l.quantity) || 1), MAX_QTY),
        },
      ];
    });
    setLines(restored);
    setHydrated(true);
  }, [available]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage no disponible (modo privado, bloqueado): la canasta vive en memoria.
    }
  }, [lines, hydrated]);

  const add = useCallback((product: Product, variant: ProductVariant, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === variant.id);
      if (existing) {
        return prev.map((l) =>
          l.variantId === variant.id
            ? { ...l, quantity: Math.min(l.quantity + quantity, MAX_QTY) }
            : l,
        );
      }
      return [
        ...prev,
        {
          variantId: variant.id,
          productName: product.name,
          variantLabel: variant.label,
          unit: variant.unit,
          price: variant.price,
          imageUrl: product.image_url,
          quantity: Math.min(quantity, MAX_QTY),
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((variantId: number, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.variantId !== variantId)
        : prev.map((l) =>
            l.variantId === variantId ? { ...l, quantity: Math.min(quantity, MAX_QTY) } : l,
          ),
    );
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      total: lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      quantityOf: (variantId) => lines.find((l) => l.variantId === variantId)?.quantity ?? 0,
      add,
      setQuantity,
      clear: () => setLines([]),
    }),
    [lines, isOpen, add, setQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Acceso a la canasta (debe usarse dentro de `CartProvider`). */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
