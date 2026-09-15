"use client";

import { useEffect, useRef, useState } from "react";
import { Share2, Mail, Link2, Check, Facebook } from "lucide-react";
import { WhatsAppIcon } from "@/components/layout/WhatsAppIcon";

/**
 * Botón "Compartir" del encabezado de la galería.
 * En dispositivos con Web Share API (móviles) abre el menú nativo de
 * compartir; en escritorio despliega opciones para WhatsApp, Email,
 * Facebook y copiar el enlace al portapapeles.
 */
export default function ShareButton({ eventName }: { eventName?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const title = eventName ? `Galería - ${eventName}` : "Galería La Rioja";

  // Cierra el menú al hacer click fuera o presionar Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleClick = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
      } catch {
        // El usuario canceló el menú nativo; no es un error.
      }
      return;
    }
    setOpen((o) => !o);
  };

  const openShare = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${title}\n${window.location.href}`);
    openShare(`https://wa.me/?text=${text}`);
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${title}\n\n${window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setOpen(false);
  };

  const shareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    openShare(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1500);
    } catch {
      setOpen(false);
    }
  };

  const itemClass =
    "flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors";

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
      >
        <Share2 size={16} /> Compartir
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 animate-fade-in z-50">
          <button onClick={shareWhatsApp} className={itemClass}>
            <WhatsAppIcon className="w-4 h-4 text-larioja-verde" />
            WhatsApp
          </button>
          <button onClick={shareEmail} className={itemClass}>
            <Mail size={16} className="text-larioja-azul dark:text-larioja-amarillo" />
            Email
          </button>
          <button onClick={shareFacebook} className={itemClass}>
            <Facebook size={16} className="text-[#1877F2]" />
            Facebook
          </button>
          <button onClick={copyLink} className={itemClass}>
            {copied ? (
              <Check size={16} className="text-larioja-verde" />
            ) : (
              <Link2 size={16} className="text-gray-500" />
            )}
            {copied ? "¡Enlace copiado!" : "Copiar enlace"}
          </button>
        </div>
      )}
    </div>
  );
}
