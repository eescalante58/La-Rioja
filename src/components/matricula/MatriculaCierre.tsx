import React from "react";
import { Phone, MessageSquare } from "lucide-react";
import { WhatsAppIcon } from "@/components/layout/WhatsAppIcon";
import type { SiteContent } from "@/types/cms";
import type { MatriculaWhatsAppConfig } from "@/lib/validation/matricula";

interface MatriculaCierreProps {
  cierreSection: SiteContent | null;
  whatsappConfig: MatriculaWhatsAppConfig | null;
  onOpenModal: () => void;
}

export function MatriculaCierre({
  cierreSection,
  whatsappConfig,
  onOpenModal,
}: MatriculaCierreProps) {
  if (!cierreSection || !cierreSection.is_active) {
    return null;
  }

  const meta = (cierreSection.metadata || {}) as Record<string, unknown>;
  const title = cierreSection.title || "Conversemos sobre el ingreso";
  const description =
    cierreSection.description ||
    "Nuestro equipo de admisiones está disponible para resolver tus dudas y acompañar a tu familia.";

  const ctaLabel = (meta.cta_label as string) || "Consultar por WhatsApp";
  const ctaAriaLabel = (meta.cta_aria_label as string) || "Consultar por WhatsApp sobre matrícula";
  const showPhone = meta.show_phone !== false;
  const displayPhone = whatsappConfig?.display_phone || "7731-0792";

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 py-16 sm:py-20 lg:py-24 border-t border-gray-100 dark:border-gray-800">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-larioja-azul p-8 sm:p-12 lg:p-16 text-white shadow-xl">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative max-w-3xl">
            <h2 className="font-montserrat text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-4">
              {title}
            </h2>

            <p className="font-inter text-base sm:text-lg text-white/90 leading-relaxed mb-8 max-w-2xl">
              {description}
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                type="button"
                onClick={onOpenModal}
                aria-label={ctaAriaLabel}
                className="inline-flex min-h-[50px] items-center justify-center gap-2.5 rounded-full bg-emerald-600 px-7 py-3.5 font-montserrat text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-500 hover:shadow-lg active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-yellow"
              >
                <WhatsAppIcon className="h-5 w-5 fill-current" />
                <span>{ctaLabel}</span>
              </button>

              {showPhone && (
                <div className="flex items-center gap-2 font-inter text-sm text-white/80 px-2 py-2">
                  <Phone size={16} className="text-larioja-amarillo" />
                  <span>WhatsApp: <strong className="text-white font-semibold">{displayPhone}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
