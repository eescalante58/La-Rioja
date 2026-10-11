"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

/**
 * Encabezado de las pantallas de proyección (/ruleta, /tombola,
 * /tombola/monitor): "LA RIOJA" como marca principal y "Centro de Formación
 * Laboral" como subtítulo, con el logo flotando a la izquierda sin ocupar
 * altura. El logo lleva a /admin/bingo (acceso rápido del operador).
 * Es la antigua variante `simple` de la navbar, sin menú ni enlaces.
 */
export function EventMasthead() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`relative z-[100] transition-all duration-500 ${
        isScrolled
          ? "bg-white/80 dark:bg-larioja-azul/80 backdrop-blur-lg shadow-lg py-1"
          : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex select-none flex-col items-center py-1.5 text-center">
          <span
            className={`font-montserrat font-black uppercase leading-none tracking-[0.18em] transition-all duration-500 ${
              isScrolled
                ? "text-base sm:text-lg md:text-xl text-larioja-azul dark:text-white"
                : "text-xl sm:text-2xl md:text-3xl text-white"
            }`}
          >
            La Rioja
          </span>
          <span
            className={`mt-1 font-montserrat font-medium uppercase leading-none tracking-[0.28em] ${
              isScrolled
                ? "text-[10px] md:text-xs text-amber-600 dark:text-larioja-amarillo"
                : "text-xs md:text-base text-larioja-amarillo"
            }`}
          >
            Centro de Formación Laboral
          </span>
        </div>
        <div className="flex items-center justify-between">
          {/* Oculto en móviles, donde el masthead ya cubre la marca. */}
          <Link
            href="/admin/bingo"
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 hidden sm:block z-[110] p-2 transition-colors"
          >
            <div
              className={`relative transition-all duration-500 ${
                isScrolled
                  ? "h-8 w-24 sm:h-10 sm:w-32 md:h-12 md:w-36 lg:h-14 lg:w-56"
                  : "h-10 w-28 sm:h-12 sm:w-36 md:h-16 md:w-48 lg:h-20 lg:w-72 xl:w-56 2xl:w-72"
              }`}
            >
              <Image
                src="/logo.png"
                alt="La Rioja Logo"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, (max-width: 1024px) 192px, 288px"
              />
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
