import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { DEFAULT_PRIVACY_COPY, PRIVACY_PATH, type PrivacyCopy } from "@/lib/privacy";

export type PrivacyNoticeVariant = keyof Omit<PrivacyCopy, "href">;

interface PrivacyNoticeProps {
  /** Variante del texto centralizado (whatsapp, apoyanos, shop, footer, cookies). */
  variant: PrivacyNoticeVariant;
  /** Sobrescritura opcional del texto desde el CMS. */
  customText?: string;
  /** Tema visual según el fondo donde se inserta el aviso. */
  tone?: "light" | "dark" | "Auto";
  /** Mostrar ícono de escudo junto al enlace. */
  showIcon?: boolean;
  className?: string;
}

/**
 * Enlace relativo hacia `/privacidad` en la misma pestaña para puntos de captura
 * de datos (botones de WhatsApp, donaciones, tienda y formularios).
 */
export function PrivacyNotice({
  variant,
  customText,
  tone = "Auto",
  showIcon = false,
  className = "",
}: PrivacyNoticeProps) {
  const text = customText?.trim() || DEFAULT_PRIVACY_COPY[variant];

  const toneClasses =
    tone === "dark"
      ? "text-white/80 hover:text-larioja-amarillo focus-visible:outline-white"
      : tone === "light"
        ? "text-gray-600 hover:text-larioja-azul focus-visible:outline-larioja-azul"
        : "text-gray-600 hover:text-larioja-azul dark:text-white/75 dark:hover:text-larioja-amarillo focus-visible:outline-larioja-azul dark:focus-visible:outline-white";

  return (
    <p className={`m-0 text-xs leading-normal ${className}`}>
      <Link
        href={PRIVACY_PATH}
        className={`inline-flex min-h-[44px] items-center gap-1.5 py-1 underline decoration-current/40 underline-offset-4 transition-colors hover:decoration-current focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${toneClasses}`}
      >
        {showIcon && <ShieldCheck size={14} className="shrink-0" aria-hidden="true" />}
        <span>{text}</span>
      </Link>
    </p>
  );
}
