"use client";

import Image from "next/image";
import { Package } from "lucide-react";
import type { Product } from "@/lib/validation/products";

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
 * Tarjeta de producto unificada con el diseño de «Compra con propósito» del Home:
 * contenedor con borde y sombra suave, contenedor 1:1 con `object-contain`,
 * tipografía Montserrat bold, precio en #184F95 y botón «Ver detalle →».
 * Toda interacción sobre la tarjeta abre la ficha de detalle (ProductSheet).
 */
export function ProductCard({ product, priority, onOpen }: ProductCardProps) {
  const available = product.variants.filter((v) => v.is_available);
  const soldOut = available.length === 0;
  const hasVariants = product.variants.length > 1;
  const priced = available.length > 0 ? available : product.variants;
  const minPrice = priced.length > 0 ? Math.min(...priced.map((v) => v.price)) : 0;
  const unit = hasVariants ? null : product.variants[0]?.unit;

  return (
    <article
      onClick={(e) => onOpen(product, e.currentTarget)}
      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
    >
      <div>
        {/* Contenedor 1:1 con object-contain limpio sin recorte */}
        <div className="relative mb-2.5 aspect-square overflow-hidden rounded-xl bg-slate-50 border border-slate-100 dark:border-slate-800/80 dark:bg-slate-800 flex items-center justify-center p-3">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              preload={priority}
              loading={priority ? "eager" : "lazy"}
              quality={75}
              sizes={PRODUCT_IMAGE_SIZES}
              className={`object-contain p-2 transition-transform duration-300 motion-safe:group-hover:scale-105 ${
                soldOut ? "opacity-50" : ""
              }`}
            />
          ) : (
            <span className="flex items-center justify-center text-slate-400">
              <Package size={36} aria-hidden="true" />
            </span>
          )}

          {soldOut && (
            <span className="absolute left-2 top-2 z-10 rounded-full bg-[#012060] px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
              Agotado
            </span>
          )}
        </div>

        {/* Título en tipografía Montserrat bold */}
        <h3 className="line-clamp-2 font-montserrat text-xs sm:text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-[#184F95] dark:text-white dark:group-hover:text-larioja-amarillo">
          <button
            type="button"
            id={`producto-${product.slug}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(product, e.currentTarget);
            }}
            className="rounded text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#184F95]"
          >
            {product.name}
          </button>
        </h3>
      </div>

      {/* Barra inferior: precio en #184F95 y botón Ver detalle */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
        <div>
          <p className="font-montserrat text-xs sm:text-sm font-extrabold text-[#184F95] dark:text-larioja-amarillo">
            {hasVariants && <span className="text-[11px] font-normal text-slate-500 mr-1">Desde</span>}
            {minPrice > 0 ? `$${minPrice.toLocaleString("es-AR")}` : "Consultar"}
            {unit && <span className="text-[11px] font-normal text-slate-400 ml-0.5">/{unit}</span>}
          </p>
          {hasVariants && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {product.variants.length} tamaños
            </p>
          )}
        </div>

        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-sky-600 transition-all group-hover:translate-x-1 dark:text-sky-400">
          Ver detalle →
        </span>
      </div>

      {soldOut && <p className="sr-only">Agotado</p>}
    </article>
  );
}
