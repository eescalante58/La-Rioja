import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Distintivo amarillo "Sistema de gestión de Productos y Bingo" (una sola línea).
 * Se usa en el panel de marca (escritorio) y sobre el formulario (móvil).
 */
export function BingoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full bg-larioja-amarillo px-3 py-1 text-xs font-medium text-larioja-azul ${className}`}
    >
      Sistema de gestión de Productos y Bingo
    </span>
  );
}

/**
 * Panel de marca del login.
 * - Escritorio (≥1024 px): columna azul marino con logo, distintivo,
 *   titular, texto de apoyo y "Volver al sitio" al pie.
 * - Menor a 1024 px: encabezado compacto de 64 px con "Volver al sitio" a la
 *   izquierda y el logo a la derecha (sin titular ni texto de apoyo).
 */
export function BrandPanel() {
  return (
    <>
      {/* Encabezado compacto (móvil y tablet) */}
      <header className="flex h-16 shrink-0 items-center justify-between bg-larioja-azul px-4 sm:px-6 lg:hidden">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-amarillo motion-reduce:transition-none"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Volver al sitio
        </Link>
        <span className="relative block h-10 w-28 rounded-lg bg-white px-2 py-1">
          <span className="relative block h-full w-full">
            <Image
              src="/logo.png"
              alt="La Rioja"
              fill
              sizes="112px"
              className="object-contain"
              priority
            />
          </span>
        </span>
      </header>

      {/* Panel completo (escritorio) */}
      <aside className="hidden flex-col bg-larioja-azul p-10 text-white lg:flex">
        <span className="relative block h-16 w-44 rounded-xl bg-white px-3 py-2">
          <span className="relative block h-full w-full">
            <Image
              src="/logo.png"
              alt="La Rioja"
              fill
              sizes="176px"
              className="object-contain"
              priority
            />
          </span>
        </span>

        <div className="mt-auto">
          <BingoBadge />
          <h2 className="mt-5 max-w-[18ch] text-[30px] font-semibold leading-tight">
            Cada producto y cartón impulsa la formación de nuestros estudiantes
          </h2>
          <span className="mt-5 block h-1 w-12 rounded-full bg-larioja-verde" aria-hidden="true" />
          <p className="mt-5 max-w-[32ch] text-sm text-white/75">
            Administra productos, cartones, facturación, juegos y ganadores desde un solo lugar.
          </p>
        </div>

        <Link
          href="/"
          className="mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-lg pt-8 text-sm text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-amarillo motion-reduce:transition-none"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Volver al sitio
        </Link>
      </aside>
    </>
  );
}
