"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Mail, MessageCircle } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { ContactTrigger } from "./ContactTrigger";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { createClient } from "@/lib/supabase/client";

/**
 * Mobile navigation component with hamburger menu.
 */
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState<string>("#");

  // Fetch WhatsApp link from CMS
  useEffect(() => {
    const fetchWhatsApp = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("site_content")
        .select("description")
        .eq("page", "social media")
        .eq("section_key", "whatsapp")
        .eq("is_active", true)
        .single();

      if (data?.description) {
        setWhatsappLink(data.description);
      }
    };
    fetchWhatsApp();
  }, []);

  // Handle scroll for sticky effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
          isScrolled
            ? "bg-white/80 dark:bg-larioja-azul/80 backdrop-blur-lg shadow-lg py-1"
            : "bg-transparent py-4"
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="relative z-[110] p-2 transition-colors">
            <div
              className={`relative transition-all duration-500 ${
                isScrolled
                  ? "h-8 w-24 sm:h-10 sm:w-32 md:h-12 md:w-36 lg:h-14 lg:w-56"
                  : "h-10 w-28 sm:h-12 sm:w-36 md:h-16 md:w-48 lg:h-20 lg:w-72"
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

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8 font-montserrat">
            <Link
              href="/about"
              className={`font-bold text-sm transition-all ${
                isScrolled
                  ? "text-larioja-azul dark:text-white hover:text-larioja-verde"
                  : "text-white hover:text-larioja-amarillo"
              }`}
            >
              Nosotros
            </Link>
            <Link
              href="/contact"
              className={`font-bold text-sm transition-all ${
                isScrolled
                  ? "text-larioja-azul dark:text-white hover:text-larioja-verde"
                  : "text-white hover:text-larioja-amarillo"
              }`}
            >
              Apóyanos
            </Link>
            <Link
              href="/programs"
              className={`font-bold text-sm transition-all ${
                isScrolled
                  ? "text-larioja-azul dark:text-white hover:text-larioja-verde"
                  : "text-white hover:text-larioja-amarillo"
              }`}
            >
              Programas
            </Link>
            <Link
              href="/faq"
              className={`font-bold text-sm transition-all ${
                isScrolled
                  ? "text-larioja-azul dark:text-white hover:text-larioja-verde"
                  : "text-white hover:text-larioja-amarillo"
              }`}
            >
              Preguntas
            </Link>
            <Link
              href="/bingo"
              className={`font-bold text-sm transition-all ${
                isScrolled
                  ? "text-larioja-azul dark:text-white hover:text-larioja-verde"
                  : "text-white hover:text-larioja-verde"
              }`}
            >
              Bingo
            </Link>
            <Link
              href="/admin"
              className={`font-bold py-2 px-6 rounded-full text-xs transition-all ${
                isScrolled
                  ? "bg-larioja-azul text-white hover:bg-larioja-azul/90"
                  : "text-white hover:text-larioja-amarillo"
              }`}
            >
              Panel de Control
            </Link>

            <ContactTrigger>
              {(openModal) => (
                <button
                  onClick={openModal}
                  className={`flex items-center gap-2 font-bold py-2 px-6 rounded-full text-xs transition-all ${
                    isScrolled
                      ? "bg-larioja-verde text-white hover:bg-larioja-verde/90"
                      : "bg-white text-larioja-azul hover:bg-larioja-amarillo hover:text-larioja-azul"
                  }`}
                >
                  <Mail size={14} />
                  Contacto
                </button>
              )}
            </ContactTrigger>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center w-9 h-9 rounded-full transition-all ${
                isScrolled
                  ? "bg-larioja-verde text-white hover:scale-110"
                  : "bg-white/10 text-white hover:bg-larioja-verde hover:scale-110 backdrop-blur-md"
              }`}
              title="WhatsApp"
            >
              <WhatsAppIcon className="w-5 h-5" />
            </a>

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
              className={`p-2 rounded-lg transition-all border ${
                isScrolled
                  ? "bg-larioja-azul text-white border-larioja-azul shadow-md"
                  : "bg-white/10 backdrop-blur-md border-white/30 text-white"
              }`}
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
          <div className="flex flex-col h-full overflow-y-auto p-6 sm:p-8 pt-20 sm:pt-24">
            <button
              onClick={toggleMenu}
              className="absolute top-6 right-6 p-2 text-white/70 hover:text-white transition-colors"
            >
              <X size={32} />
            </button>

            <div className="flex flex-col gap-2 sm:gap-4 text-center font-montserrat">
              <Link
                href="/about"
                onClick={() => setIsOpen(false)}
                className="text-xl sm:text-2xl font-medium text-white/90 hover:text-white transition-all py-3 sm:py-4 border-b border-white/5"
              >
                Nosotros
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="text-xl sm:text-2xl font-medium text-white/90 hover:text-white transition-all py-3 sm:py-4 border-b border-white/5"
              >
                Apóyanos
              </Link>
              <Link
                href="/programs"
                onClick={() => setIsOpen(false)}
                className="text-xl sm:text-2xl font-medium text-white/90 hover:text-white transition-all py-3 sm:py-4 border-b border-white/5"
              >
                Programas
              </Link>
              <Link
                href="/faq"
                onClick={() => setIsOpen(false)}
                className="text-xl sm:text-2xl font-medium text-white/90 hover:text-white transition-all py-3 sm:py-4 border-b border-white/5"
              >
                Preguntas
              </Link>
              <Link
                href="/bingo"
                onClick={() => setIsOpen(false)}
                className="text-xl sm:text-2xl font-medium text-larioja-verde hover:text-larioja-verde/80 transition-all py-3 sm:py-4 border-b border-white/5"
              >
                Bingo
              </Link>
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="text-xl sm:text-2xl font-medium text-larioja-amarillo hover:text-larioja-amarillo/80 transition-all py-3 sm:py-4 border-b border-white/5"
              >
                Panel de Control
              </Link>

              <ContactTrigger>
                {(openModal) => (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      openModal();
                    }}
                    className="text-xl sm:text-2xl font-medium text-larioja-verde hover:text-white transition-all py-3 sm:py-4 flex items-center justify-center gap-3"
                  >
                    <Mail size={24} />
                    Contacto
                  </button>
                )}
              </ContactTrigger>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="text-xl sm:text-2xl font-medium text-white hover:text-larioja-verde transition-all py-3 sm:py-4 flex items-center justify-center gap-3 border-t border-white/10"
              >
                <WhatsAppIcon className="w-6 h-6 text-larioja-verde" />
                WhatsApp
              </a>
            </div>

            <div className="mt-auto pt-8 pb-8 sm:pb-12 text-center text-white/40 text-sm italic">
              Formando futuros, integrando vidas.
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
