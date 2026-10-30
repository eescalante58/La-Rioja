"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  FileText,
  Printer,
  CheckCircle2,
  Info,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Stethoscope,
  GraduationCap,
} from "lucide-react";
import { MessageCircle } from "lucide-react";
import { waLink } from "@/lib/whatsapp";
import type { AdmissionRequirementsConfig, AdmissionRequirementItem, AdmissionCategory } from "@/lib/validation/admission";

interface AdmissionRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AdmissionRequirementsConfig;
  whatsapp?: string;
  onOpenContactModal?: () => void;
}

const CATEGORY_META: Record<
  AdmissionCategory,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  identidad: { label: "Documentos de Identidad", icon: UserCheck },
  salud: { label: "Salud y Diagnósticos Médicos", icon: Stethoscope },
  educacion: { label: "Historial Educativo y Constancias", icon: GraduationCap },
  fotos: { label: "Fotografías del Estudiante", icon: FileText },
  general: { label: "Documentación General", icon: ShieldCheck },
};

export function AdmissionRequirementsModal({
  isOpen,
  onClose,
  config,
  whatsapp = "",
  onOpenContactModal,
}: AdmissionRequirementsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Manejo de teclado (Escape) y bloqueo de scroll
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (!mounted || !isOpen) {
    return null;
  }

  // Agrupar ítems por categorías
  const categoriesPresent = Array.from(
    new Set(config.items.map((i) => i.categoria || "general")),
  ) as AdmissionCategory[];

  const checkedCount = Object.values(checkedIds).filter(Boolean).length;
  const totalCount = config.items.length;

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 pt-20 sm:pt-24 pb-6 overflow-y-auto bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admission-requirements-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[85vh] my-auto flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Cabecera */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-b from-blue-50/60 dark:from-blue-950/20 to-white dark:to-slate-900 rounded-t-3xl">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-2xl bg-larioja-azul text-larioja-amarillo flex items-center justify-center shrink-0 shadow-sm border border-larioja-amarillo/30"
              aria-hidden="true"
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-larioja-azul dark:text-larioja-amarillo bg-blue-100/80 dark:bg-blue-900/40 px-2.5 py-0.5 rounded-full">
                  Admisiones Nuevo Ingreso
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {checkedCount} de {totalCount} preparados
                </span>
              </div>
              <h3
                id="admission-requirements-title"
                className="text-base sm:text-lg font-extrabold text-larioja-azul dark:text-white mt-1.5 leading-snug font-montserrat"
              >
                {config.titulo}
              </h3>
              {config.subtitulo && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {config.subtitulo}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 grid place-items-center transition-colors shrink-0 cursor-pointer"
            aria-label="Cerrar modal de requisitos"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {categoriesPresent.map((catKey, catIdx) => {
            const meta = CATEGORY_META[catKey] || CATEGORY_META.general;
            const CategoryIcon = meta.icon;
            const itemsInCat = config.items.filter(
              (i) => (i.categoria || "general") === catKey,
            );

            return (
              <div key={catKey} className="space-y-2.5">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <CategoryIcon className="w-3.5 h-3.5 text-larioja-azul dark:text-larioja-amarillo" />
                  <span>
                    {catIdx + 1}. {meta.label}
                  </span>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <div className="space-y-2">
                  {itemsInCat.map((item) => {
                    const isChecked = Boolean(checkedIds[item.id]);

                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer group ${
                          isChecked
                            ? "bg-blue-50/80 dark:bg-blue-950/30 border-larioja-azul/40 dark:border-larioja-amarillo/40"
                            : "bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/40 dark:hover:bg-slate-800 border-slate-200/90 dark:border-slate-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheck(item.id)}
                          className="mt-0.5 w-4 h-4 rounded text-larioja-azul border-slate-300 dark:border-slate-600 focus:ring-larioja-azul shrink-0 cursor-pointer"
                        />
                        <div className="flex-1">
                          <span
                            className={`font-semibold transition-colors ${
                              isChecked
                                ? "text-larioja-azul dark:text-larioja-amarillo line-through opacity-90"
                                : "text-slate-900 dark:text-white group-hover:text-larioja-azul dark:group-hover:text-larioja-amarillo"
                            }`}
                          >
                            {item.texto}
                          </span>
                          {item.nota && (
                            <span className="ml-2 inline-block text-[11px] font-medium text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/40">
                              {item.nota}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Nota al pie informativa */}
          <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-950 dark:text-amber-200 flex items-start gap-3 text-xs leading-relaxed">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Indicaciones generales:</strong> {config.pie} Si tienes dudas con la
              obtención de diagnósticos médicos o constancias previas, el equipo de admisiones te
              brindará orientación personalizada en la primera entrevista.
            </div>
          </div>
        </div>

        {/* Pie con Acciones */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 rounded-b-3xl flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimir lista</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            {onOpenContactModal ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenContactModal();
                }}
                className="px-4 py-2 rounded-xl bg-larioja-azul hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer dark:bg-larioja-amarillo dark:text-larioja-azul dark:hover:bg-yellow-400"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Agendar visita</span>
              </button>
            ) : (
              <a
                href={waLink(
                  whatsapp,
                  "Hola, tengo consultas sobre los requisitos de matrícula para nuevo ingreso en La Rioja",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Consultar por WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
