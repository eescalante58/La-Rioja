import Image from "next/image";
import { Package } from "lucide-react";
import { WhatsAppIcon } from "@/components/layout/WhatsAppIcon";
import type { Product } from "@/lib/validation/products";

const priceFormatter = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
});

interface ProductCardProps {
  product: Product;
  /** Número de WhatsApp solo con dígitos; sin él no se muestra el botón. */
  whatsappDigits?: string;
}

/**
 * Tarjeta pública de un producto con botón «Pedir por WhatsApp»
 * (mensaje prellenado con el nombre del producto).
 */
export function ProductCard({ product, whatsappDigits }: ProductCardProps) {
  const soldOut = !product.is_available;
  const message = `Hola, me interesa el producto «${product.name}» de La Rioja.`;
  const orderLink = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`
    : undefined;

  return (
    <article className="group flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-slate-800 overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${soldOut ? "grayscale opacity-70" : ""}`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-white/20">
            <Package size={56} />
          </div>
        )}
        <span className="absolute top-3 left-3 py-1 px-3 rounded-full bg-white/90 dark:bg-slate-900/90 text-larioja-azul dark:text-white text-xs font-bold shadow-sm">
          {product.category}
        </span>
        {soldOut && (
          <span className="absolute top-3 right-3 py-1 px-3 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wide shadow-sm">
            Agotado
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-6">
        <h3 className="text-xl font-bold text-larioja-azul dark:text-white mb-2 break-words">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed mb-4 whitespace-pre-line">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-end justify-between gap-3 flex-wrap">
          <p className="text-larioja-azul dark:text-larioja-amarillo">
            {product.price !== null ? (
              <>
                <span className="text-2xl font-bold">{priceFormatter.format(product.price)}</span>
                {product.unit && (
                  <span className="text-sm text-gray-500 dark:text-white/60">
                    {" "}
                    / {product.unit}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm font-semibold">Precio a consultar</span>
            )}
          </p>

          {orderLink &&
            (soldOut ? (
              <span className="inline-flex items-center gap-2 py-2.5 px-4 rounded-full bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/50 text-sm font-bold cursor-not-allowed">
                <WhatsAppIcon className="w-4 h-4" />
                No disponible
              </span>
            ) : (
              <a
                href={orderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 py-2.5 px-4 rounded-full bg-larioja-verde text-white text-sm font-bold hover:bg-larioja-verde/90 hover:scale-105 transition-all"
              >
                <WhatsAppIcon className="w-4 h-4" />
                Pedir por WhatsApp
              </a>
            ))}
        </div>
      </div>
    </article>
  );
}
