"use client";

import { useId, useState } from "react";
import { Check } from "lucide-react";
import { TrackedLink } from "./TrackedLink";
import { BTN_NAVY } from "./support-ui";

/** Monto sugerido con su equivalencia tangible (vacía = no se muestra). */
export interface DonationAmount {
  monto: string;
  equivalencia: string;
}

interface DonationAmountPickerProps {
  amounts: DonationAmount[];
  /** Texto del botón para donación única. */
  ctaOnce: string;
  /** Texto del botón para donación mensual. */
  ctaMonthly: string;
}

/** Índice especial para «Otro monto». */
const OTHER = -1;

/**
 * Selector de montos de la tarjeta «Donación única o mensual»: botones de
 * monto, «Otro» con campo libre, equivalencia del monto elegido e
 * interruptor «Hacerlo mensual» (activado por defecto). El botón lleva a
 * los medios de pago (#donar).
 */
export function DonationAmountPicker({ amounts, ctaOnce, ctaMonthly }: DonationAmountPickerProps) {
  const [selected, setSelected] = useState<number>(
    amounts.length > 1 ? 1 : amounts.length ? 0 : OTHER,
  );
  const [other, setOther] = useState<string>("");
  const [monthly, setMonthly] = useState<boolean>(true);
  const otherId = useId();
  const switchId = useId();

  const current = selected === OTHER ? undefined : amounts[selected];
  const otherValue = other.trim() ? `$${other.trim()}` : "";
  const label = current?.monto ?? otherValue;

  const pill = (on: boolean) =>
    `min-h-[48px] rounded-xl font-montserrat text-base font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul dark:focus-visible:outline-white ${
      on
        ? "border-2 border-larioja-azul bg-larioja-azul text-larioja-amarillo dark:border-larioja-amarillo"
        : "border border-[#7C879C] bg-white text-larioja-azul hover:bg-[#F3F5F8] dark:bg-transparent dark:text-white dark:hover:bg-white/10"
    }`;

  return (
    <>
      <div
        role="group"
        aria-label="Monto de la donación"
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${amounts.length + 1}, minmax(0, 1fr))` }}
      >
        {amounts.map((a, i) => (
          <button
            key={a.monto}
            type="button"
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
            className={pill(selected === i)}
          >
            {a.monto}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={selected === OTHER}
          onClick={() => setSelected(OTHER)}
          className={pill(selected === OTHER)}
        >
          Otro
        </button>
      </div>

      {selected === OTHER && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={otherId}
            className="text-sm font-semibold text-larioja-azul dark:text-white"
          >
            Otro monto (US$)
          </label>
          <input
            id={otherId}
            type="number"
            inputMode="decimal"
            min={1}
            step="any"
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder="Ej. 40"
            className="min-h-[48px] w-full rounded-xl border border-field bg-white px-4 text-base text-larioja-azul focus:border-larioja-azul focus:outline-none focus:ring-2 focus:ring-larioja-azul/30 dark:bg-transparent dark:text-white"
          />
        </div>
      )}

      <p
        aria-live="polite"
        className="m-0 flex items-start gap-2.5 rounded-[14px] bg-[#F3F5F8] px-4 py-3.5 text-[15px] leading-normal text-larioja-azul dark:bg-white/5 dark:text-white"
      >
        <Check
          size={20}
          className="mt-0.5 shrink-0 text-larioja-verde-texto dark:text-larioja-verde"
          aria-hidden="true"
        />
        <span>
          {label ? (
            <>
              <strong>
                {current?.equivalencia ? "" : "Tu aporte: "}
                {label}
                {monthly ? " al mes" : ""}
                {current?.equivalencia ? ":" : ""}
              </strong>
              {current?.equivalencia && <> {current.equivalencia}</>}
            </>
          ) : (
            "Elige el monto que quieras aportar."
          )}
        </span>
      </p>

      <div className="flex items-center gap-3">
        <button
          id={switchId}
          type="button"
          role="switch"
          aria-checked={monthly}
          onClick={() => setMonthly((m) => !m)}
          className={`flex h-[30px] w-[52px] shrink-0 rounded-full p-[3px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul dark:focus-visible:outline-white ${
            monthly ? "justify-end bg-larioja-verde-texto" : "justify-start bg-[#7C879C]"
          }`}
        >
          <span className="block h-6 w-6 rounded-full bg-white" />
        </button>
        <label
          htmlFor={switchId}
          className="cursor-pointer text-[15px] font-semibold text-larioja-azul dark:text-white"
        >
          Hacerlo mensual{" "}
          <span className="font-normal text-gray-600 dark:text-white/70">(recomendado)</span>
        </label>
      </div>

      <TrackedLink
        href="#donar"
        event="donar"
        origin="donacion"
        className={`${BTN_NAVY} mt-auto w-full rounded-[14px]`}
      >
        {monthly ? ctaMonthly : ctaOnce}
      </TrackedLink>
    </>
  );
}
