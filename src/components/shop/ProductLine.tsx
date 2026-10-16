"use client";

import type { Product, ProductLine as Line } from "@/lib/validation/products";
import { ProductGrid } from "./ProductGrid";

interface ProductLineProps {
  line: Line & { products: Product[] };
  /** Imágenes con prioridad en esta línea (solo la primera línea visible). */
  priorityCount: number;
  onOpen: (product: Product, trigger: HTMLElement) => void;
  onAdded: (productName: string) => void;
}

/**
 * Separa la primera oración del resto para mostrar una frase y "Ver más".
 * @param text Descripción de la línea.
 * @returns Primera oración y el resto (vacío si no hay más).
 */
function splitFirstSentence(text: string): [string, string] {
  const match = text.match(/^(.+?[.!?])\s+([\s\S]+)$/);
  return match ? [match[1], match[2]] : [text, ""];
}

/**
 * Bloque de una línea de productos (Tote bags, Toallas de mano…): encabezado
 * con el número de productos, una frase de la descripción con "Ver más",
 * eslogan y su propia cuadrícula. Conserva el ancla `#linea-{id}`.
 */
export function ProductLine({ line, priorityCount, onOpen, onAdded }: ProductLineProps) {
  const [first, rest] = line.description ? splitFirstSentence(line.description) : ["", ""];
  const count = line.products.length;

  return (
    <section
      id={`linea-${line.id}`}
      data-line-id={line.id}
      aria-labelledby={`linea-${line.id}-titulo`}
      className="scroll-mt-[var(--shop-scroll-offset,200px)]"
    >
      <div className="mb-3 sm:mb-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id={`linea-${line.id}-titulo`}
            className="font-montserrat text-[17px] sm:text-xl font-bold text-[#184F95] dark:text-sky-300"
          >
            {line.name}
          </h2>
          <span className="shrink-0 text-[13px] text-[var(--shop-text-3)] sm:text-sm">
            {count} {count === 1 ? "producto" : "productos"}
          </span>
        </div>

        {first && (
          <details className="group mt-1 text-[13px] leading-relaxed text-[var(--shop-text-3)] sm:text-sm">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              {first}
              {rest && (
                <span className="ml-1 font-medium text-[var(--shop-text)] underline underline-offset-2 group-open:hidden">
                  Ver más
                </span>
              )}
            </summary>
            {rest && <p className="mt-1">{rest}</p>}
          </details>
        )}
        {line.slogan && (
          // En oscuro, verde más claro: larioja-verde sobre el navy no llega a 4.5:1.
          <p className="mt-1 text-[13px] font-medium italic text-larioja-verde dark:text-green-400 sm:text-sm">
            {line.slogan}
          </p>
        )}
      </div>

      <ProductGrid
        products={line.products}
        priorityCount={priorityCount}
        onOpen={onOpen}
        onAdded={onAdded}
      />
    </section>
  );
}
