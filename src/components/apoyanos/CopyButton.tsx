"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyButtonProps {
  /** Texto que se copia (p. ej. el número de cuenta). */
  value: string;
  /** Qué se copia, para el lector de pantalla. */
  label: string;
}

/** Botón «Copiar» con confirmación breve. */
export function CopyButton({ value, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Portapapeles bloqueado: el dato sigue visible para copiarlo a mano.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `${label} copiado` : `Copiar ${label}`}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border border-[#7C879C] bg-white px-3 text-[13px] font-semibold text-larioja-azul hover:bg-[#F3F5F8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul dark:bg-transparent dark:text-white dark:hover:bg-white/10"
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}
