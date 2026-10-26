import React from "react";
import type { SiteContent } from "@/types/cms";

interface MatriculaIntroProps {
  introSection: SiteContent | null;
  onOpenModal: () => void;
}

export function MatriculaIntro({ introSection, onOpenModal }: MatriculaIntroProps) {
  if (!introSection || !introSection.is_active) {
    return null;
  }

  const title = introSection.title?.trim();
  const description = introSection.description?.trim();
  const meta = (introSection.metadata || {}) as Record<string, unknown>;
  const ctaLabel = (meta.cta_label as string) || "Consultar admisión";
  const ctaAriaLabel = (meta.cta_aria_label as string) || "Consultar admisión por WhatsApp";
  const showCta = meta.show_cta !== false;

  if (!title && !description) {
    return null;
  }

  return (
    <section className="border-b border-gray-100 bg-white/50 dark:bg-gray-900/40 py-3 sm:py-4">
      <div className="mx-auto flex max-w-screen-xl flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div>
          {title && (
            <p className="font-montserrat text-xs sm:text-sm font-bold uppercase tracking-wider text-larioja-azul dark:text-larioja-amarillo">
              {title}
            </p>
          )}
          {description && (
            <p className="font-inter text-xs text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {showCta && (
          <button
            type="button"
            onClick={onOpenModal}
            aria-label={ctaAriaLabel}
            className="inline-flex min-h-[38px] items-center justify-center rounded-full bg-larioja-azul px-4 py-1.5 font-montserrat text-xs font-bold text-white shadow-xs transition-all hover:bg-larioja-azul-profundo active:scale-95"
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </section>
  );
}
