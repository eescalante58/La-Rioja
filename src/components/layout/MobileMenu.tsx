"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type RefObject,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  GraduationCap,
  HelpCircle,
  PartyPopper,
  ShoppingBag,
  HeartHandshake,
  Mail,
  Lock,
  X,
  ChevronRight,
  Instagram,
  Facebook,
  type LucideIcon,
} from "lucide-react";
import { ContactTrigger } from "./ContactTrigger";
import { WhatsAppIcon } from "./WhatsAppIcon";

/** Enlaces de redes sociales (vienen del CMS, página "social media"). */
export interface MobileMenuSocialLinks {
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  x?: string;
}

interface MobileMenuProps {
  /** Si el panel está abierto. */
  open: boolean;
  /** Cierra el panel (X, capa oscura, Escape o al elegir un enlace). */
  onClose: () => void;
  /** Botón hamburguesa: recibe el foco de vuelta al cerrar. */
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  /** Enlaces externos de WhatsApp y redes. */
  social: MobileMenuSocialLinks;
  /** Hay un Bingo en curso: muestra la insignia "Juega". */
  bingoActive: boolean;
}

interface NavLinkDef {
  href: string;
  label: string;
  Icon: LucideIcon;
  badge?: string;
  featured?: boolean;
}

const LINKS: NavLinkDef[] = [
  { href: "/", label: "Inicio", Icon: Home },
  { href: "/about", label: "Nosotros", Icon: Users },
  { href: "/programs", label: "Programas", Icon: GraduationCap },
  { href: "/faq", label: "Preguntas", Icon: HelpCircle },
  { href: "/bingo", label: "Bingo", Icon: PartyPopper, badge: "Juega" },
  { href: "/productos", label: "La Rioja Shop", Icon: ShoppingBag, featured: true },
];

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Logo de X (simple-icons): Lucide no incluye la marca nueva. */
function XLogo({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/**
 * Indica si `href` corresponde a la página actual. La raíz solo coincide
 * exacta; el resto también con sus subrutas (p. ej. /productos/...).
 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Menú hamburguesa móvil: panel lateral derecho en tres zonas (encabezado de
 * marca, navegación con iconos y acciones fijas abajo).
 * Especificación: `Documentacion/La Rioja — Menú hamburguesa móvil diseño y especificaciones.md`.
 *
 * Accesibilidad: bloquea el scroll del body, mueve el foco al botón cerrar,
 * atrapa el foco dentro del panel, cierra con Escape y devuelve el foco al
 * botón hamburguesa. Cerrado queda `inert` (fuera del orden de tabulación y
 * del árbol de accesibilidad).
 */
export function MobileMenu({
  open,
  onClose,
  returnFocusRef,
  social,
  bingoActive,
}: MobileMenuProps) {
  const pathname = usePathname() ?? "/";
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // Abrir: bloquear scroll, foco al botón cerrar y Escape para cerrar.
  // Cerrar: devolver el foco al botón hamburguesa.
  useEffect(() => {
    if (!open) {
      if (wasOpen.current) returnFocusRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, returnFocusRef]);

  /** Trampa de foco: Tab / Shift+Tab ciclan dentro del panel. */
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const socials = [
    {
      key: "instagram",
      href: social.instagram,
      label: "Instagram",
      icon: <Instagram size={22} aria-hidden="true" />,
    },
    {
      key: "facebook",
      href: social.facebook,
      label: "Facebook",
      icon: <Facebook size={22} aria-hidden="true" />,
    },
    { key: "x", href: social.x, label: "X", icon: <XLogo /> },
  ].filter((s) => s.href && s.href !== "#");

  return (
    <>
      <div
        className="menu-overlay xl:hidden"
        data-open={open}
        onClick={onClose}
        aria-hidden="true"
      />
      <nav
        id="mobile-menu"
        ref={panelRef}
        className="menu-panel xl:hidden"
        data-open={open}
        aria-label="Menú principal"
        inert={!open}
        onKeyDown={handleKeyDown}
      >
        {/* Zona 1: encabezado de marca */}
        <div className="menu-header">
          <span className="menu-logo">
            <Image
              src="/LogoLaRioja.webp"
              alt=""
              width={44}
              height={44}
              className="h-full w-full object-contain"
            />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="menu-brand">La Rioja</span>
            <span className="menu-brand-sub">Centro de Formación Laboral</span>
          </span>
          <button
            ref={closeRef}
            type="button"
            className="menu-close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        {/* Zona 2: navegación principal (única zona con scroll) */}
        <div className="menu-nav">
          <p className="menu-label" id="mobile-menu-explora">
            Explora
          </p>
          <ul aria-labelledby="mobile-menu-explora">
            {LINKS.map(({ href, label, Icon, badge, featured }, i) => {
              const showBadge = Boolean(badge) && bingoActive;
              return (
                <li key={href} className="menu-stagger" style={{ "--i": i } as CSSProperties}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className="menu-item"
                    aria-current={isActive(pathname, href) ? "page" : undefined}
                    data-featured={featured || undefined}
                  >
                    <span className="menu-icon">
                      <Icon size={20} strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="flex-1">{label}</span>
                    {showBadge ? (
                      <span className="menu-badge">{badge}</span>
                    ) : (
                      <ChevronRight size={18} aria-hidden="true" className="menu-chevron" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Zona 3: acciones fijas al fondo */}
        <div className="menu-actions">
          <Link href="/contact" onClick={onClose} className="menu-cta">
            <HeartHandshake size={20} aria-hidden="true" />
            Apóyanos
          </Link>

          <div className="menu-row">
            <a
              href={social.whatsapp ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="menu-btn menu-btn-whatsapp"
            >
              <WhatsAppIcon className="h-5 w-5" />
              WhatsApp
            </a>
            <ContactTrigger>
              {(openModal) => (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openModal();
                  }}
                  className="menu-btn menu-btn-outline"
                >
                  <Mail size={20} aria-hidden="true" />
                  Contacto
                </button>
              )}
            </ContactTrigger>
          </div>

          <div className="menu-footer">
            <div className="flex items-center gap-1">
              {socials.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="menu-social"
                >
                  {s.icon}
                </a>
              ))}
            </div>
            <Link href="/admin" onClick={onClose} className="menu-staff">
              <Lock size={16} aria-hidden="true" />
              Acceso personal
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
