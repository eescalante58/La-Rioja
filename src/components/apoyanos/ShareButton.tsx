"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

interface ShareButtonProps {
  className?: string;
  /** Título que se comparte junto con el enlace de la página. */
  title: string;
}

/**
 * «Comparte esta página»: usa el menú de compartir del sistema si existe
 * (celulares) y, si no, copia el enlace al portapapeles.
 */
export function ShareButton({ className, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href.split("#")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // El usuario canceló el menú de compartir o el navegador bloqueó el portapapeles.
    }
  };

  return (
    <button type="button" onClick={share} className={className}>
      <Share2 size={16} aria-hidden="true" />
      <span aria-live="polite">{copied ? "Enlace copiado" : "Comparte esta página"}</span>
    </button>
  );
}
