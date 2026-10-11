"use client";

import type { AnchorHTMLAttributes } from "react";
import { track } from "@vercel/analytics";

/** Eventos de clic medidos en /apoyanos (Vercel Analytics). */
export type SupportEvent =
  | "donar"
  | "apadrinar"
  | "especie"
  | "empresas"
  | "enviar_comprobante"
  | "tarjeta"
  | "datos_bancarios"
  | "contacto";

interface TrackedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Nombre del evento que se registra al hacer clic. */
  event: SupportEvent;
  /** Sección de la página donde está el botón (para distinguir CTAs repetidos). */
  origin: string;
}

/**
 * Enlace que registra un evento de Vercel Analytics al hacer clic.
 * Los enlaces externos (WhatsApp, pasarela) se abren en otra pestaña.
 */
export function TrackedLink({ event, origin, onClick, href, children, ...rest }: TrackedLinkProps) {
  const external = href?.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
      onClick={(e) => {
        track(event, { origen: origin });
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
