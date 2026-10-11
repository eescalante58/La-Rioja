"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/** Pestaña de medio de pago. */
export interface PaymentTab {
  /** Texto completo (tablet y escritorio). */
  label: string;
  /** Texto corto para celular (opcional). */
  shortLabel?: string;
  content: ReactNode;
}

interface PaymentTabsProps {
  tabs: PaymentTab[];
}

/**
 * Pestañas accesibles de «Cómo donar» (patrón WAI-ARIA tabs: flechas,
 * Inicio y Fin mueven el foco y activan la pestaña).
 */
export function PaymentTabs({ tabs }: PaymentTabsProps) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    setActive(next);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowRight") select(active + 1);
    else if (e.key === "ArrowLeft") select(active - 1);
    else if (e.key === "Home") select(0);
    else if (e.key === "End") select(tabs.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div className="flex flex-col rounded-[22px] bg-white p-2 shadow-[0_1px_3px_rgba(1,22,64,0.08)] dark:bg-surface-card dark:ring-1 dark:ring-white/10 sm:p-2.5">
      <div
        role="tablist"
        aria-label="Medios de pago"
        className="grid gap-1.5 rounded-2xl bg-[#F3F5F8] p-1.5 dark:bg-white/5"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab, i) => {
          const on = i === active;
          return (
            <button
              key={tab.label}
              ref={(el) => {
                refs.current[i] = el;
              }}
              id={`${baseId}-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`${baseId}-panel-${i}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={onKeyDown}
              className={`min-h-[48px] rounded-xl px-2 py-2 font-montserrat text-[13px] font-bold leading-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul dark:focus-visible:outline-white sm:px-2.5 sm:text-sm ${
                on
                  ? "bg-larioja-azul text-white dark:bg-larioja-amarillo dark:text-larioja-azul"
                  : "bg-transparent text-larioja-azul hover:bg-white/70 dark:text-white dark:hover:bg-white/10"
              }`}
            >
              {tab.shortLabel ? (
                <>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </>
              ) : (
                tab.label
              )}
            </button>
          );
        })}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={tab.label}
          id={`${baseId}-panel-${i}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${i}`}
          hidden={i !== active}
          tabIndex={0}
          className="px-3 pb-4 pt-6 focus-visible:outline-none sm:px-5"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
