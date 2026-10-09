"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Package, Plus, ShoppingBasket } from "lucide-react";
import { usd } from "@/lib/validation/shop-orders";
import type { Product } from "@/lib/validation/products";
import { useCart } from "./CartProvider";

interface ProductCardProps {
  product: Product;
  /** Tarjeta reducida para líneas con muchos productos (p. ej. panadería). */
  compact?: boolean;
}

/**
 * Tarjeta pública de un producto: foto recortada sobre fondo crema (como el
 * catálogo impreso), presentaciones, precio y control para agregar a la canasta.
 */
export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { add, setQuantity, quantityOf } = useCart();
  const firstAvailable = product.variants.find((v) => v.is_available) ?? product.variants[0];
  const [selectedId, setSelectedId] = useState<number>(firstAvailable.id);
  const variant = product.variants.find((v) => v.id === selectedId) ?? firstAvailable;
  const soldOut = !variant.is_available;
  const allSoldOut = product.variants.every((v) => !v.is_available);
  const qty = quantityOf(variant.id);

  return (
    <article
      className={`group flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-lg transition-all duration-300 ${
        compact ? "rounded-2xl" : "rounded-3xl"
      }`}
    >
      <div className="relative aspect-square bg-[#f3efe7] dark:bg-slate-800 overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes={
              compact
                ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            }
            className={`object-contain p-4 transition-transform duration-500 group-hover:scale-105 ${
              allSoldOut ? "grayscale opacity-60" : ""
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#d8cfbf] dark:text-white/15">
            <Package size={compact ? 40 : 56} />
          </div>
        )}
        {allSoldOut && (
          <span className="absolute top-3 right-3 py-1 px-3 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wide shadow-sm">
            Agotado
          </span>
        )}
      </div>

      <div className={`flex flex-col flex-1 ${compact ? "p-3 gap-2" : "p-5 gap-3"}`}>
        <h3
          className={`font-bold text-larioja-azul dark:text-white break-words leading-tight ${
            compact ? "text-sm sm:text-base" : "text-lg"
          }`}
        >
          {product.name}
        </h3>
        {!compact && product.description && (
          <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed line-clamp-3">
            {product.description}
          </p>
        )}

        {product.variants.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Presentación">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={v.id === variant.id}
                onClick={() => setSelectedId(v.id)}
                className={`py-1 px-3 rounded-full text-xs font-bold border transition-colors ${
                  v.id === variant.id
                    ? "bg-larioja-azul text-white border-larioja-azul dark:bg-larioja-amarillo dark:text-larioja-azul dark:border-larioja-amarillo"
                    : "bg-white text-larioja-azul border-gray-200 hover:border-larioja-azul dark:bg-transparent dark:text-white dark:border-white/20"
                } ${v.is_available ? "" : "line-through opacity-60"}`}
              >
                {v.label ?? "Única"}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 flex-wrap">
          <p className="text-larioja-azul dark:text-larioja-amarillo leading-none">
            <span className={`font-bold ${compact ? "text-lg" : "text-2xl"}`}>
              {usd.format(variant.price)}
            </span>
            {variant.unit && (
              <span className="block text-xs text-gray-500 dark:text-white/60 mt-1">
                por {variant.unit}
              </span>
            )}
          </p>

          {soldOut ? (
            <span className="py-2 px-3 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50 text-xs font-bold">
              Agotado
            </span>
          ) : qty > 0 ? (
            <div
              className="inline-flex items-center rounded-full border border-larioja-verde bg-larioja-verde/10"
              aria-label={`Cantidad de ${product.name} en la canasta`}
            >
              <button
                type="button"
                onClick={() => setQuantity(variant.id, qty - 1)}
                className="p-2 text-larioja-verde hover:bg-larioja-verde/20 rounded-full"
                aria-label="Quitar uno"
              >
                <Minus size={14} />
              </button>
              <span className="min-w-[2ch] text-center text-sm font-bold text-larioja-azul dark:text-white">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => add(product, variant)}
                className="p-2 text-larioja-verde hover:bg-larioja-verde/20 rounded-full"
                aria-label="Agregar uno"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => add(product, variant)}
              className={`inline-flex items-center gap-1.5 rounded-full bg-larioja-verde text-white font-bold hover:bg-larioja-verde/90 transition-all ${
                compact ? "py-2 px-3 text-xs" : "py-2.5 px-4 text-sm"
              }`}
            >
              <ShoppingBasket size={compact ? 14 : 16} />
              Agregar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
