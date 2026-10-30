"use client";

import React, { useState, useEffect } from "react";
import { FileText, RotateCcw, Sparkles, CheckCircle2, Info } from "lucide-react";
import {
  DEFAULT_ADMISSION_CONFIG,
  DEFAULT_ADMISSION_ITEMS,
  parseRequirementLine,
  type AdmissionRequirementItem,
} from "@/lib/validation/admission";

interface AdmissionFieldsEditorProps {
  metadata: Record<string, unknown>;
  onChange: (updatedMeta: Record<string, unknown>) => void;
}

export function AdmissionFieldsEditor({ metadata, onChange }: AdmissionFieldsEditorProps) {
  const titulo = (metadata.requisitos_titulo as string) || DEFAULT_ADMISSION_CONFIG.titulo;
  const subtitulo = (metadata.requisitos_subtitulo as string) || DEFAULT_ADMISSION_CONFIG.subtitulo;
  const boton = (metadata.requisitos_boton as string) || DEFAULT_ADMISSION_CONFIG.boton;
  const pie = (metadata.requisitos_pie as string) || DEFAULT_ADMISSION_CONFIG.pie;

  // Reconstruir texto multilinea a partir de los items existentes o de requisitos_texto
  const getInitialText = (): string => {
    if (typeof metadata.requisitos_texto === "string" && metadata.requisitos_texto.trim()) {
      return metadata.requisitos_texto;
    }
    if (Array.isArray(metadata.requisitos_items) && metadata.requisitos_items.length > 0) {
      return (metadata.requisitos_items as AdmissionRequirementItem[])
        .map((it) => (it.nota ? `${it.texto} (${it.nota})` : it.texto))
        .join("\n");
    }
    return DEFAULT_ADMISSION_ITEMS.map((it) =>
      it.nota ? `${it.texto} (${it.nota})` : it.texto,
    ).join("\n");
  };

  const [rawText, setRawText] = useState(getInitialText);

  // Sincronizar texto local si cambia metadata externa
  useEffect(() => {
    setRawText(getInitialText());
  }, [metadata.requisitos_items, metadata.requisitos_texto]);

  const updateField = (field: string, val: unknown) => {
    onChange({
      ...metadata,
      [field]: val,
    });
  };

  const handleTextChange = (newText: string) => {
    setRawText(newText);
    const parsedItems = newText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line, idx) => parseRequirementLine(line, idx));

    onChange({
      ...metadata,
      requisitos_texto: newText,
      requisitos_items: parsedItems,
    });
  };

  const handleResetDefaults = () => {
    const defaultText = DEFAULT_ADMISSION_ITEMS.map((it) =>
      it.nota ? `${it.texto} (${it.nota})` : it.texto,
    ).join("\n");

    setRawText(defaultText);
    onChange({
      ...metadata,
      requisitos_titulo: DEFAULT_ADMISSION_CONFIG.titulo,
      requisitos_subtitulo: DEFAULT_ADMISSION_CONFIG.subtitulo,
      requisitos_boton: DEFAULT_ADMISSION_CONFIG.boton,
      requisitos_pie: DEFAULT_ADMISSION_CONFIG.pie,
      requisitos_texto: defaultText,
      requisitos_items: DEFAULT_ADMISSION_ITEMS,
    });
  };

  const parsedItemsCount = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean).length;

  return (
    <div className="rounded-2xl border-2 border-larioja-azul/30 bg-blue-50/40 dark:bg-blue-950/20 p-5 sm:p-6 space-y-6">
      {/* Cabecera del bloque */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 dark:border-blue-900/40 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-larioja-azul text-larioja-amarillo grid place-items-center shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-montserrat text-sm font-bold text-larioja-azul dark:text-white uppercase tracking-wider">
              Modal de Requisitos de Matrícula (Nuevo Ingreso)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configura los títulos, notas y la lista interactiva de documentos requeridos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-larioja-azul dark:hover:text-larioja-amarillo flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar 11 requisitos oficiales</span>
        </button>
      </div>

      {/* Campos de texto generales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Título del Modal
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => updateField("requisitos_titulo", e.target.value)}
            placeholder="Documentos a presentar para proceso de estudiantes de nuevo ingreso"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs bg-white dark:bg-slate-950 focus:ring-2 focus:ring-larioja-azul outline-none dark:text-white"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Texto del Botón Activador (en Datos Útiles)
          </label>
          <input
            type="text"
            value={boton}
            onChange={(e) => updateField("requisitos_boton", e.target.value)}
            placeholder="Ver lista de requisitos (11 documentos)"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs bg-white dark:bg-slate-950 focus:ring-2 focus:ring-larioja-azul outline-none dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
          Subtítulo / Instrucción en la cabecera del modal
        </label>
        <input
          type="text"
          value={subtitulo}
          onChange={(e) => updateField("requisitos_subtitulo", e.target.value)}
          placeholder="Presentar la siguiente documentación en original y copia..."
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs bg-white dark:bg-slate-950 focus:ring-2 focus:ring-larioja-azul outline-none dark:text-white"
        />
      </div>

      {/* Editor rápido línea por línea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span>Lista de Requisitos ({parsedItemsCount} detectados)</span>
            <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-larioja-azul dark:text-blue-300 px-2 py-0.5 rounded-full">
              1 documento por línea
            </span>
          </label>
          <span className="text-[11px] text-slate-400">
            Los paréntesis (ej. <code>(si es menor de 18 años)</code>) se convierten en etiquetas.
          </span>
        </div>

        <textarea
          rows={11}
          value={rawText}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-3.5 text-xs font-mono bg-white dark:bg-slate-950 focus:ring-2 focus:ring-larioja-azul outline-none dark:text-slate-200 leading-relaxed resize-y"
          placeholder="Escribe un requisito por línea..."
          spellCheck={false}
        />

        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-snug">
            El sistema clasifica automáticamente los documentos en 3 grupos visuales: <strong>Identidad</strong> (DUI, partidas), <strong>Salud y Diagnósticos</strong> (médicos, neurológico, psicológico, medicamentos) e <strong>Historial Escolar y Fotografías</strong>.
          </p>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
          Nota legal o aclaratoria al pie del modal
        </label>
        <textarea
          rows={2}
          value={pie}
          onChange={(e) => updateField("requisitos_pie", e.target.value)}
          placeholder="Todos los documentos deben presentarse en original y copia..."
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs bg-white dark:bg-slate-950 focus:ring-2 focus:ring-larioja-azul outline-none dark:text-white resize-y"
        />
      </div>
    </div>
  );
}
