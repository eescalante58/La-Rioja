"use client";

import type { Product } from "@/lib/validation/products";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  /** Cuántas imágenes cargar con prioridad (las primeras visibles de la página). */
  priorityCount: number;
  onOpen: (product: Product, trigger: HTMLElement) => void;
  onAdded: (productName: string) => void;
}

/**
 * Cuadrícula responsive de productos: 2 columnas en celular, 3 desde 640 px,
 * 4 desde 1024 px y 5 desde 1280 px. `minmax(0, 1fr)` (grid-cols-N de
 * Tailwind) evita que un nombre largo desborde la columna.
 */
export function ProductGrid({ products, priorityCount, onOpen, onAdded }: ProductGridProps) {
  return (
    <ul
      role="list"
      className="grid grid-cols-2 gap-x-2.5 gap-y-3.5 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-5 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-6 xl:grid-cols-5 xl:gap-x-6 xl:gap-y-7"
    >
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            priority={index < priorityCount}
            onOpen={onOpen}
            onAdded={onAdded}
          />
        </li>
      ))}
    </ul>
  );
}
