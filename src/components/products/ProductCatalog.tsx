"use client";

import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/validation/products";

interface ProductCatalogProps {
  products: Product[];
  whatsappDigits?: string;
}

const ALL = "Todos";

/**
 * Catálogo público: filtro por categoría (chips) sobre los productos ya
 * cargados en el servidor y cuadrícula responsiva de tarjetas.
 */
export function ProductCatalog({ products, whatsappDigits }: ProductCatalogProps) {
  const [category, setCategory] = useState<string>(ALL);

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  );

  const visible = useMemo(
    () => (category === ALL ? products : products.filter((p) => p.category === category)),
    [products, category],
  );

  if (products.length === 0) {
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
    <div>
      {categories.length > 2 && (
        <div
          className="flex flex-wrap justify-center gap-2 mb-10"
          role="toolbar"
          aria-label="Filtrar por categoría"
        >
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`py-2 px-5 rounded-full text-sm font-bold transition-all border ${
                category === c
                  ? "bg-larioja-azul text-white border-larioja-azul dark:bg-larioja-amarillo dark:text-larioja-azul dark:border-larioja-amarillo"
                  : "bg-white text-larioja-azul border-gray-200 hover:border-larioja-azul dark:bg-transparent dark:text-white dark:border-white/20 dark:hover:border-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} whatsappDigits={whatsappDigits} />
        ))}
      </div>
    </div>
  );
}
