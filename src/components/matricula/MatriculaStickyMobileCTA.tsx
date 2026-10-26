import React from "react";
import { WhatsAppIcon } from "@/components/layout/WhatsAppIcon";
import type { SiteContent } from "@/types/cms";

interface MatriculaStickyMobileCTAProps {
  ctaMovilSection: SiteContent | null;
  onOpenModal: () => void;
}

export function MatriculaStickyMobileCTA({
  ctaMovilSection,
  onOpenModal,
}: MatriculaStickyMobileCTAProps) {
  if (!ctaMovilSection || !ctaMovilSection.is_active) {
    return null;
  }

  const meta = (ctaMovilSection.metadata || {}) as Record<string, unknown>;
  const title = ctaMovilSection.title || "Consultar por WhatsApp";
  const ariaLabel = (meta.aria_label as string) || "Consultar por WhatsApp sobre matrícula";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200/80 bg-white/95 backdrop-blur-md px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg dark:border-gray-800 dark:bg-gray-900/95 lg:hidden animate-fade-in">
      <button
        type="button"
        onClick={onOpenModal}
        aria-label={ariaLabel}
        className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-montserrat text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
      >
        <WhatsAppIcon className="h-5 w-5 fill-current" />
        <span>{title}</span>
      </button>
    </div>
  );
}
