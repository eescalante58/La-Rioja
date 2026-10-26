import React from "react";
import { MessageCircle, FileText, Calendar, LucideIcon } from "lucide-react";
import type { SiteContent } from "@/types/cms";

interface MatriculaProcesoProps {
  procesoSection: SiteContent | null;
  pasos: SiteContent[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  MessageCircle,
  FileText,
  Calendar,
};

export function MatriculaProceso({ procesoSection, pasos }: MatriculaProcesoProps) {
  if (!procesoSection || !procesoSection.is_active) {
    return null;
  }

  const title = procesoSection.title || "Tu próximo paso";
  const description =
    procesoSection.description ||
    "Un proceso cercano y transparente para acompañar a tu familia en cada etapa.";

  return (
    <section id="proceso" className="scroll-mt-24 bg-white dark:bg-gray-950 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-montserrat text-2xl sm:text-3xl lg:text-4xl font-bold text-larioja-azul dark:text-larioja-amarillo">
            {title}
          </h2>
          {description && (
            <p className="font-inter mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-300">
              {description}
            </p>
          )}
        </div>

        {pasos.length > 0 && (
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {pasos.map((paso, idx) => {
              const meta = (paso.metadata || {}) as Record<string, unknown>;
              const stepNumber = (meta.step_number as number) || idx + 1;
              const iconKey = (meta.icon as string) || "MessageCircle";
              const IconComponent = ICON_MAP[iconKey] || MessageCircle;

              return (
                <div
                  key={paso.id || paso.section_key}
                  className="relative flex flex-col rounded-3xl bg-gray-50/80 dark:bg-gray-900/60 p-7 sm:p-8 border border-gray-100 dark:border-gray-800 transition-all hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-larioja-azul text-white font-montserrat text-base font-extrabold shadow-sm">
                      {stepNumber}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-800 text-larioja-azul dark:text-larioja-amarillo shadow-xs border border-gray-100 dark:border-gray-700">
                      <IconComponent size={20} />
                    </div>
                  </div>

                  <h3 className="font-montserrat text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {paso.title}
                  </h3>

                  <p className="font-inter text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {paso.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
