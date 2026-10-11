"use client";

import Image from "next/image";
import { Package } from "lucide-react";
import type { Product } from "@/lib/validation/products";
import { AddToCartControl } from "./AddToCartControl";
import { Price } from "./Price";

/** `sizes` de la especificación: la imagen se pide a ~384-640 px, no a 3840. */
export const PRODUCT_IMAGE_SIZES =
  "(max-width: 639px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 256px";

interface ProductCardProps {
  product: Product;
  /** Solo las primeras imágenes visibles al cargar. */
  priority: boolean;
  /** Abre la hoja de detalle; `trigger` recibe el foco al cerrarla. */
  onOpen: (product: Product, trigger: HTMLElement) => void;
  onAdded: (productName: string) => void;
}

/**
 * Tarjeta de producto estilo catálogo: foto sobre fondo claro con el botón
 * "+" superpuesto, nombre en dos líneas y precio. Sin fondo ni borde propios;
 * la foto clara sobre el fondo de la página define la tarjeta. Foto y nombre
 * abren el detalle; el "+" es un control independiente.
 */
export function ProductCard({ product, priority, onOpen, onAdded }: ProductCardProps) {
  const available = product.variants.filter((v) => v.is_available);
  const soldOut = available.length === 0;
  const hasVariants = product.variants.length > 1;
  const priced = available.length > 0 ? available : product.variants;
  const minPrice = priced.length > 0 ? Math.min(...priced.map((v) => v.price)) : 0;
  const unit = hasVariants ? null : product.variants[0]?.unit;

  return (
    <article className="group">
      <div className="relative">
        {/* Foto: abre el detalle. Fuera del orden de tabulación (el nombre es el control). */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={(e) => onOpen(product, e.currentTarget)}
          className="relative block aspect-square w-full overflow-hidden rounded-xl bg-[var(--shop-tile)] sm:rounded-[14px]"
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt=""
              fill
              preload={priority}
              loading={priority ? "eager" : "lazy"}
              quality={75}
              sizes={PRODUCT_IMAGE_SIZES}
              className={`object-contain p-[8%] transition-transform duration-200 motion-safe:group-hover:scale-[1.03] ${
                soldOut ? "opacity-50" : ""
              }`}
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-[#5A6782]/40">
              <Package size={40} aria-hidden="true" />
            </span>
          )}
        </button>

        {soldOut ? (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-[#012060] px-2 py-0.5 text-[11px] font-medium text-white sm:left-2 sm:top-2">
            Agotado
          </span>
        ) : (
          <AddToCartControl
            product={product}
            onChooseVariant={() => {
              const card = document.getElementById(`producto-${product.slug}`);
              onOpen(product, card ?? document.body);
            }}
            onAdded={onAdded}
          />
        )}
      </div>

      <h3 className="mt-2 h-[2.6em] text-[13px] font-normal leading-[1.3] text-[var(--shop-text)] sm:text-sm">
        <button
          type="button"
          id={`producto-${product.slug}`}
          onClick={(e) => onOpen(product, e.currentTarget)}
          className="line-clamp-2 rounded text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shop-focus)]"
        >
          {product.name}
        </button>
      </h3>

      <Price value={minPrice} from={hasVariants} unit={unit} />
      {hasVariants && (
        <p className="text-[11px] text-[var(--shop-text-3)] sm:text-xs">
          {product.variants.length} tamaños
        </p>
      )}
      {soldOut && <p className="sr-only">Agotado</p>}
    </article>
  );
}
