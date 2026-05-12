"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Mobile navigation component with hamburger menu.
 */
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // Block scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Desktop & Mobile Fixed Navbar container */}
      <nav className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="relative z-[110] p-2 transition-colors">
            <div className="relative h-10 w-28 sm:h-12 sm:w-36 md:h-16 md:w-48 lg:h-20 lg:w-72">
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

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <Link
              href="/about"
              className="text-white hover:text-larioja-amarillo font-bold text-sm transition-all"
            >
              Nosotros
            </Link>
            <Link
              href="/faq"
              className="text-white hover:text-larioja-amarillo font-bold text-sm transition-all"
            >
              Preguntas
            </Link>
            <Link
              href="/bingo"
              className="text-white hover:text-larioja-verde font-bold text-sm transition-all"
            >
              Bingo
            </Link>
            <Link
              href="/admin"
              className="text-white hover:text-larioja-amarillo font-bold py-2 px-6 rounded-full text-xs transition-all"
            >
              Panel de Control
            </Link>
            <div className="">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile & Tablet Toggle */}
          <div className="lg:hidden flex items-center gap-3 relative z-[120]">
            <div className="">
              <ThemeToggle />
            </div>
            <button
              onClick={toggleMenu}
              className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/30 text-white hover:bg-white/20 transition-all"
              aria-label="Menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div
          className={`lg:hidden fixed inset-0 bg-larioja-azul/98 backdrop-blur-2xl transition-all duration-500 z-[115] ${
            isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
          }`}
        >
          <div className="flex flex-col h-full p-8 pt-24">
            <button
              onClick={toggleMenu}
              className="absolute top-6 right-6 p-2 text-white/70 hover:text-white transition-colors"
            >
              <X size={32} />
            </button>

            <div className="flex flex-col gap-6 text-center">
              <Link
                href="/about"
                onClick={() => setIsOpen(false)}
                className="text-3xl font-bold text-white hover:text-larioja-amarillo transition-colors py-4 border-b border-white/10"
              >
                Nosotros
              </Link>
              <Link
                href="/faq"
                onClick={() => setIsOpen(false)}
                className="text-3xl font-bold text-white hover:text-larioja-amarillo transition-colors py-4 border-b border-white/10"
              >
                Preguntas
              </Link>
              <Link
                href="/bingo"
                onClick={() => setIsOpen(false)}
                className="text-3xl font-bold text-white hover:text-larioja-verde transition-colors py-4 border-b border-white/10"
              >
                Bingo
              </Link>
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="text-3xl font-bold text-larioja-amarillo hover:text-white transition-colors py-4"
              >
                Panel de Control
              </Link>
            </div>

            <div className="mt-auto pb-12 text-center text-white/40 text-sm italic">
              Formando futuros, integrando vidas.
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
