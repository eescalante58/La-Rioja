import Image from "next/image";
import Link from "next/link";

interface CampaignPhotoProps {
  src: string;
  alt: string;
  tag: string;
  href: string;
}

/**
 * Bloque de imagen de una campaña.
 * Opción 1: Enlace directo al destino de la campaña con zoom interactivo elegante al hover.
 * Elimina modales invasivos de pantalla completa e íconos obstructivos en el centro.
 */
export function CampaignPhoto({ src, alt, tag, href }: CampaignPhotoProps) {
  const isExternal = /^https?:\/\//i.test(href);
  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="relative block aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800"
      aria-label={`Ir a la campaña: ${alt}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 767px) 100vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Gradiente sutil para legibilidad del tag y contraste */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      {/* Etiqueta de campaña */}
      {tag && (
        <span className="absolute left-3 top-3 rounded-full bg-larioja-amarillo px-3 py-0.5 text-[11px] font-extrabold text-larioja-azul shadow-xs">
          {tag}
        </span>
      )}
    </Link>
  );
}
