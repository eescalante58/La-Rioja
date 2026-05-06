"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Mobile navigation component with hamburger menu.
 */
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Desktop & Mobile Fixed Navbar container */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Empty div for spacing if needed, logo is absolute in page.tsx but we can move it here or keep it separate */}
          <div className="w-40 md:w-64" /> 

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <Link
              href="/about"
              className="text-white hover:text-larioja-amarillo font-bold text-sm transition-all"
            >
              Nosotros
            </Link>
            <Link
              href="/bingo"
              className="text-white hover:text-larioja-verde font-bold text-sm transition-all"
            >
              Bingo
            </Link>
            <Link
              href="/admin"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 font-bold py-2 px-6 rounded-full text-xs transition-all"
            >
              Panel de Control
            </Link>
            <div className="bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/30">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile & Tablet Toggle */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/30">
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
          className={`lg:hidden fixed inset-0 bg-larioja-azul/95 backdrop-blur-xl transition-all duration-500 z-[60] ${
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
