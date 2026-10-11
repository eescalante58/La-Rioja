"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { HeartHandshake, Home, Lock, Menu, Moon, Sun } from "lucide-react";
import { MobileMenu, isActive, type MobileMenuSocialLinks } from "./MobileMenu";
import { createClient } from "@/lib/supabase/client";

/** Enlaces públicos, en orden de interés del visitante (Inicio va aparte, como icono). */
const LINKS = [
  { href: "/about", label: "Nosotros" },
  { href: "/programs", label: "Programas" },
  { href: "/bingo", label: "Bingo" },
  { href: "/productos", label: "La Rioja Shop" },
  { href: "/faq", label: "Preguntas" },
] as const;

/** Foco de teclado amarillo (sobre el azul de la barra). */
const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow";

/** Botones de icono (tema y acceso): 44 px en móvil, 40 px en escritorio. */
const ICON_BTN = `grid h-11 w-11 shrink-0 place-items-center rounded-full border border-nav-icon text-white transition-colors hover:bg-white/10 motion-reduce:transition-none lg:h-10 lg:w-10 ${FOCUS}`;

/**
 * Clases de un enlace de la barra: ocupa todo el alto (área de clic) y marca
 * la página actual con una línea amarilla de 2 px.
 * @param active Si el enlace corresponde a la página actual.
 */
function linkClass(active: boolean): string {
  return `flex h-nav items-center border-b-2 border-t-2 border-t-transparent transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-yellow ${
    active
      ? "border-b-brand-yellow text-white"
      : "border-b-transparent text-white/[.88] hover:border-b-white/40 hover:text-white"
  }`;
}

/**
 * Barra de navegación del sitio público.
 * Especificación: "La Rioja — Navbar del sitio: revisión y especificaciones".
 *
 * Barra fija (`sticky`) en azul de marca con tres zonas: logo, navegación
 * (icono de inicio y cinco enlaces, desde `lg`) y acciones (tema, acceso
 * personal y "Apóyanos"). Por debajo de 1024 px muestra el botón que abre
 * `MobileMenu`. El alto sale de `--nav-h` (64 / 72 px, en globals.css).
 */
export function Navbar() {
  const pathname = usePathname() ?? "/";
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [social, setSocial] = useState<MobileMenuSocialLinks>({});
  const [bingoActive, setBingoActive] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  const isDark = resolvedTheme !== "light";

  // Tema solo tras montar (next-themes) y estado de scroll para el fondo translúcido.
  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Enlaces de WhatsApp y redes desde el CMS (página "social media") para el menú móvil.
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
    fetch("/api/public/bingo-status")
      .then((r) => r.json())
      .then((json: { success: boolean; data?: { active: boolean } }) => {
        if (json.success && json.data) setBingoActive(json.data.active);
      })
      .catch(() => {});
  }, []);

  const homeActive = pathname === "/";

  return (
    <>
      <header
        className={`sticky top-0 z-[100] border-b border-nav pt-[env(safe-area-inset-top)] font-montserrat transition-[background-color,box-shadow] duration-200 motion-reduce:transition-none ${
          scrolled ? "bg-nav/90 shadow-nav backdrop-blur-md" : "bg-nav"
        }`}
      >
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-ink"
        >
          Saltar al contenido
        </a>

        <div className="mx-auto flex h-nav max-w-screen-xl items-center gap-2 pl-4 pr-3 lg:gap-6 lg:px-8">
          {/* Identidad */}
          <Link
            href="/"
            className={`flex h-10 shrink-0 items-center rounded-logo bg-logo-surface px-2 lg:h-12 lg:px-2.5 ${FOCUS}`}
          >
            <Image
              src="/LogoLaRioja.webp"
              alt="La Rioja, Centro de Formación Laboral — ir al inicio"
              width={1200}
              height={630}
              sizes="160px"
              className="h-[34px] w-auto lg:h-10"
              style={{ width: "auto" }}
              priority
            />
          </Link>

          {/* Navegación (escritorio) */}
          <nav aria-label="Principal" className="hidden flex-1 justify-center lg:flex">
            <ul className="flex gap-5 xl:gap-7">
              <li>
                <Link
                  href="/"
                  title="Inicio"
                  aria-current={homeActive ? "page" : undefined}
                  className={`${linkClass(homeActive)} px-1`}
                >
                  <Home size={20} aria-hidden="true" />
                  <span className="sr-only">Inicio</span>
                </Link>
              </li>
              {LINKS.map(({ href, label }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`${linkClass(active)} whitespace-nowrap text-[15px] font-semibold`}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <span className="flex-1 lg:hidden" />

          {/* Acciones */}
          {mounted ? (
            <button
              type="button"
              className={ICON_BTN}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {isDark ? (
                <Sun className="h-[22px] w-[22px] lg:h-5 lg:w-5" aria-hidden="true" />
              ) : (
                <Moon className="h-[22px] w-[22px] lg:h-5 lg:w-5" aria-hidden="true" />
              )}
            </button>
          ) : (
            <span className="h-11 w-11 shrink-0 lg:h-10 lg:w-10" aria-hidden="true" />
          )}

          <Link
            href="/admin"
            aria-label="Acceso personal"
            title="Acceso personal"
            className={`${ICON_BTN} hidden lg:grid`}
          >
            <Lock size={20} aria-hidden="true" />
          </Link>

          <Link
            href="/contact"
            className="hidden h-10 shrink-0 items-center gap-2 rounded-full bg-brand-yellow px-[18px] text-sm font-semibold text-brand-ink transition-[filter] hover:brightness-[.92] motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:flex"
          >
            <HeartHandshake size={18} aria-hidden="true" />
            Apóyanos
          </Link>

          <button
            ref={burgerRef}
            type="button"
            onClick={() => setIsOpen((o) => !o)}
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            aria-controls="mobile-menu"
            aria-expanded={isOpen}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/[.12] text-white transition-colors hover:bg-white/20 motion-reduce:transition-none lg:hidden ${FOCUS}`}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Menú móvil — fuera del <header> para que el backdrop-blur no lo
          confine (backdrop-filter crea un containing block para fixed). */}
      <MobileMenu
        open={isOpen}
        onClose={closeMenu}
        returnFocusRef={burgerRef}
        social={social}
        bingoActive={bingoActive}
      />
    </>
  );
}
