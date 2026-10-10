"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { ContactTrigger } from "./ContactTrigger";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { MobileMenu, type MobileMenuSocialLinks } from "./MobileMenu";
import { createClient } from "@/lib/supabase/client";

/**
 * Barra de navegación del sitio público: enlaces en escritorio (xl+) y
 * botón hamburguesa que abre `MobileMenu` en móvil/tablet.
 */
export function Navbar({
  solid = false,
  brandHeader = false,
  simple = false,
  fixed = true,
}: {
  solid?: boolean;
  brandHeader?: boolean;
  simple?: boolean;
  fixed?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [social, setSocial] = useState<MobileMenuSocialLinks>({});
  const [bingoActive, setBingoActive] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);

  const whatsappLink = social.whatsapp ?? "#";
  const closeMenu = useCallback(() => setIsOpen(false), []);

  const navSolid = isScrolled || solid;
  const isFixed = fixed;

  // Enlaces de WhatsApp y redes desde el CMS (página "social media").
  useEffect(() => {
    const fetchSocial = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("site_content")
        .select("section_key, description")
        .eq("page", "social media")
        .in("section_key", ["whatsapp", "instagram", "facebook", "x"])
        .eq("is_active", true);

      if (!data) return;
      const links: MobileMenuSocialLinks = {};
      for (const row of data as { section_key: string; description: string | null }[]) {
        const value = row.description?.trim();
        if (!value) continue;
        if (row.section_key === "whatsapp") {
          // Normaliza a https://wa.me/<solo dígitos>: un "+" o espacios en el
          // valor del CMS hacen que WhatsApp reporte "el número no existe".
          const digits = value.match(/(\d{6,15})/);
          links.whatsapp = digits ? `https://wa.me/${digits[1]}` : value;
        } else {
          links[row.section_key as keyof MobileMenuSocialLinks] = value;
        }
      }
      setSocial(links);
    };
    fetchSocial();
  }, []);

  // ¿Hay Bingo en curso? Controla la insignia "Juega" del menú móvil.
  useEffect(() => {
    if (simple) return;
    fetch("/api/public/bingo-status")
      .then((r) => r.json())
      .then((json: { success: boolean; data?: { active: boolean } }) => {
        if (json.success && json.data) setBingoActive(json.data.active);
      })
      .catch(() => {});
  }, [simple]);

  // Handle scroll for sticky effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      <nav
        className={`${isFixed ? "fixed top-0 left-0 right-0" : "relative"} z-[100] transition-all duration-500 ${
          navSolid
            ? "bg-white/80 dark:bg-larioja-azul/80 backdrop-blur-lg shadow-lg py-1"
            : "bg-transparent py-4"
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
          {/* Masthead institucional (página Bingo): fila superior centrada —
              "LA RIOJA" como marca principal y "Centro de Formación Laboral"
              como subtítulo refinado con amplio tracking, por encima del menú. */}
          {brandHeader && (
            <div className="flex select-none flex-col items-center py-1.5 text-center">
              <span
                className={`font-montserrat font-black uppercase leading-none tracking-[0.18em] transition-all duration-500 ${
                  navSolid
                    ? "text-base sm:text-lg md:text-xl text-larioja-azul dark:text-white"
                    : simple
                      ? "text-xl sm:text-2xl md:text-3xl text-white"
                      : "text-lg sm:text-xl md:text-2xl text-white"
                }`}
              >
                La Rioja
              </span>
              <span
                className={`mt-1 font-montserrat font-medium uppercase leading-none tracking-[0.28em] ${
                  navSolid
                    ? "text-[10px] md:text-xs text-amber-600 dark:text-larioja-amarillo"
                    : simple
                      ? "text-xs md:text-base text-larioja-amarillo"
                      : "text-[10px] md:text-xs text-larioja-amarillo"
                }`}
              >
                Centro de Formación Laboral
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            {/* Logo — en modo simple (ruleta/tómbola) flota a la izquierda del
              masthead sin ocupar altura: la ruleta sube ~96px. Oculto en
              móviles donde el masthead ya cubre la marca.
              En simple redirige a /admin/bingo (acceso rápido del operador
              desde la pantalla de proyección). */}
            <Link
              href={simple ? "/admin/bingo" : "/"}
              className={`${
                simple
                  ? "absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 hidden sm:block"
                  : "relative"
              } z-[110] p-2 transition-colors`}
            >
              <div
                className={`relative transition-all duration-500 ${
                  navSolid
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

            {!simple && (
              <>
                {/* Desktop Navigation */}
                <div className="hidden xl:flex items-center gap-4 2xl:gap-8 font-montserrat">
                  <Link
                    href="/about"
                    className={`font-bold text-sm transition-all ${
                      navSolid
                        ? "text-larioja-azul dark:text-white hover:text-larioja-verde"
                        : "text-white hover:text-larioja-amarillo"
                    }`}
                  >
                    Nosotros
                  </Link>
                  <Link
                    href="/contact"
                    className={`font-bold text-sm transition-all ${
                      navSolid
                        ? "text-larioja-azul dark:text-white hover:text-larioja-verde"
                        : "text-white hover:text-larioja-amarillo"
                    }`}
                  >
                    Apóyanos
                  </Link>
                  <Link
                    href="/programs"
                    className={`font-bold text-sm transition-all ${
                      navSolid
                        ? "text-larioja-azul dark:text-white hover:text-larioja-verde"
                        : "text-white hover:text-larioja-amarillo"
                    }`}
                  >
                    Programas
                  </Link>
                  <Link
                    href="/faq"
                    className={`font-bold text-sm transition-all ${
                      navSolid
                        ? "text-larioja-azul dark:text-white hover:text-larioja-verde"
                        : "text-white hover:text-larioja-amarillo"
                    }`}
                  >
                    Preguntas
                  </Link>
                  <Link
                    href="/bingo"
                    className={`font-bold text-sm transition-all ${
                      navSolid
                        ? "text-larioja-azul dark:text-white hover:text-larioja-verde"
                        : "text-white hover:text-larioja-verde"
                    }`}
                  >
                    Bingo
                  </Link>
                  <Link
                    href="/productos"
                    className={`font-bold text-sm whitespace-nowrap transition-all ${
                      navSolid
                        ? "text-larioja-azul dark:text-white hover:text-larioja-verde"
                        : "text-white hover:text-larioja-amarillo"
                    }`}
                  >
                    La Rioja Shop
                  </Link>
                  <Link
                    href="/admin"
                    className={`font-bold py-2 px-6 rounded-full text-xs whitespace-nowrap transition-all ${
                      navSolid
                        ? "bg-larioja-azul text-white hover:bg-larioja-azul/90"
                        : "text-white hover:text-larioja-amarillo"
                    }`}
                  >
                    Inicio de sesión
                  </Link>

                  <ContactTrigger>
                    {(openModal) => (
                      <button
                        onClick={openModal}
                        className={`flex items-center gap-2 font-bold py-2 px-6 rounded-full text-xs transition-all ${
                          navSolid
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
                      navSolid
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
                <div className="xl:hidden flex items-center gap-3 relative z-[120]">
                  <div className="">
                    <ThemeToggle />
                  </div>
                  <button
                    ref={burgerRef}
                    type="button"
                    onClick={toggleMenu}
                    className={`burger flex h-11 w-11 flex-col items-center justify-center gap-1 rounded-lg transition-all border ${
                      navSolid
                        ? "bg-larioja-azul text-white border-larioja-azul shadow-md"
                        : "bg-white/10 backdrop-blur-md border-white/30 text-white"
                    }`}
                    aria-expanded={isOpen}
                    aria-controls="mobile-menu"
                    aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
                  >
                    <span className="burger-line" aria-hidden="true" />
                    <span className="burger-line" aria-hidden="true" />
                    <span className="burger-line" aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Menú móvil — fuera de <nav> para que el backdrop-blur no lo
          confine (backdrop-filter crea un containing block para fixed). */}
      {!simple && (
        <MobileMenu
          open={isOpen}
          onClose={closeMenu}
          returnFocusRef={burgerRef}
          social={social}
          bingoActive={bingoActive}
        />
      )}
    </>
  );
}
