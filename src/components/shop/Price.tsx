import { usd } from "@/lib/validation/shop-orders";

interface PriceProps {
  /** Precio en dólares. */
  value: number;
  /** Antepone "Desde" (productos con varios tamaños: precio menor). */
  from?: boolean;
  /** Unidad de venta de la variante ("docena", "unidad"…), si existe. */
  unit?: string | null;
  /** "card" en la cuadrícula; "sheet" en la hoja de detalle (más grande). */
  size?: "card" | "sheet";
}

/**
 * Precio de La Rioja Shop con los centavos en tamaño menor ($10<sup>.00</sup>),
 * en el color `--shop-price`. El texto visual se oculta a lectores de pantalla
 * y se anuncia completo ("Desde 10,00 US$ por docena").
 */
export function Price({ value, from = false, unit, size = "card" }: PriceProps) {
  const [whole, cents] = value.toFixed(2).split(".");
  const spoken = `${from ? "Desde " : ""}${usd.format(value)}${unit ? ` por ${unit}` : ""}`;
  const big = size === "sheet";

  return (
    <p
      className={`font-medium leading-tight text-[var(--shop-price)] ${
        big ? "text-2xl" : "mt-0.5 text-base sm:text-lg"
      }`}
    >
      <span className="sr-only">{spoken}</span>
      <span aria-hidden="true">
        {from && (
          <span className={big ? "mr-1 text-base" : "mr-1 text-[13px] sm:text-sm"}>Desde</span>
        )}
        ${whole}
        <span className={`ml-px align-[6px] ${big ? "text-sm" : "text-[10px] sm:text-[11px]"}`}>
          .{cents}
        </span>
        {unit && (
          <span
            className={`ml-1 font-normal text-[var(--shop-text-3)] ${big ? "text-sm" : "text-[11px] sm:text-xs"}`}
          >
            / {unit}
          </span>
        )}
      </span>
    </p>
  );
}
