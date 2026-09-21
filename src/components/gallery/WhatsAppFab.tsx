"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { WhatsAppIcon } from "@/components/layout/WhatsAppIcon";

/**
 * Botón flotante (FAB) de WhatsApp para la página pública del Bingo.
 *
 * Se renderiza vía portal directamente en `document.body` para que
 * `position: fixed` sea relativo al viewport. Sin el portal, un ancestro
 * con `transform` u `overflow` (p. ej. la cinta marquee de la cuenta
 * regresiva) crearía un containing block que recorta el botón en el
 * borde derecho de la pantalla.
 */
export default function WhatsAppFab({ href }: { href: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Solicitar información vía WhatsApp"
      title="Solicitar información vía WhatsApp"
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-larioja-verde p-4 text-white shadow-2xl transition-all hover:scale-110 hover:bg-larioja-verde/90 md:px-5"
    >
      <WhatsAppIcon className="h-7 w-7 shrink-0" />
      <span className="hidden font-montserrat text-sm font-bold md:inline">
        Solicitar información
      </span>
    </a>,
    document.body,
  );
}
