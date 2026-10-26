import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, ArrowUpRight } from "lucide-react";
import { getSectionContent, getPageContent } from "@/services/cms";
import { isMatriculaActive } from "@/lib/matricula/matricula-service";
import type { SiteContent } from "@/types/cms";

/**
 * Botón accesible de red social con icono oficial y área táctil mínima de 44x44px (WCAG 2.2).
 */
function OfficialSocialLink({
  href,
  label,
  hoverColor,
  children,
}: {
  href: string;
  label: string;
  hoverColor: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/90 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-md ${hoverColor} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-amarillo focus-visible:ring-offset-2 focus-visible:ring-offset-larioja-azul-profundo`}
    >
      {children}
    </a>
  );
}

/**
 * Footer institucional rediseñado en 4 columnas temáticas.
 * Integra la identidad de marca, navegación, vías de apoyo y la información de contacto y sede.
 * Obtiene dinámicamente sus datos desde el CMS de Supabase.
 */
export async function Footer() {
  const [ctaResult, socialResult, footerResult, matriculaResult] = await Promise.allSettled([
    getSectionContent("home", "cl_cta"),
    getPageContent("social media"),
    getSectionContent("footer", "derechos reservados"),
    isMatriculaActive(),
  ]);

  const ctaContent = ctaResult.status === "fulfilled" ? ctaResult.value : null;
  const socialLinks = socialResult.status === "fulfilled" ? socialResult.value : [];
  const copyrightContent = footerResult.status === "fulfilled" ? footerResult.value : null;
  const matriculaActive = matriculaResult.status === "fulfilled" ? matriculaResult.value : false;

  const copyrightText =
    copyrightContent?.description?.trim() ||
    `© ${new Date().getFullYear()} Asociación de Padres y Amigos de Personas con Discapacidad Intelectual (ASPAPREM) / Centro de Formación Laboral La Rioja.`;

  const ctaMeta = (ctaContent?.metadata ?? {}) as Record<string, string>;

  // Datos dinámicos de contacto desde el CMS con fallback
  const tel1 = ctaMeta.telefono_1 || "7731-0792";
  const tel2 = ctaMeta.telefono_2 || "2248-4198";
  const direccion =
    ctaMeta.direccion ||
    "Urb. Lomas de Altamira, Calzada El Zenzontle, block 2 #7, San Salvador";

  const getSocialLink = (key: string): string => {
    if (!Array.isArray(socialLinks)) return "#";
    const link = socialLinks.find((l: SiteContent) => l.section_key === key);
    const desc = link?.description?.trim();
    if (!desc || desc === "#") return "#";
    if (desc.startsWith("http://") || desc.startsWith("https://") || desc.startsWith("mailto:")) return desc;
    return `https://${desc}`;
  };

  const mapsUrl = getSocialLink("google maps");
  const waNumber = tel1.replace(/\D/g, "");
  const waUrl = getSocialLink("whatsapp") !== "#" ? getSocialLink("whatsapp") : `https://wa.me/${waNumber}`;
  const igUrl = getSocialLink("instagram");
  const fbUrl = getSocialLink("facebook");
  const ytUrl = getSocialLink("youtube") !== "#" ? getSocialLink("youtube") : "https://www.youtube.com/@LaRiojaCFL";
  const xUrl = getSocialLink("x") !== "#" ? getSocialLink("x") : getSocialLink("twitter");

  // Obtener correo desde CMS (page = 'social media', section_key = 'email', campo description)
  // Limpiando cualquier prefijo inadvertido como https:// o mailto:
  const emailRow = Array.isArray(socialLinks)
    ? socialLinks.find((l: SiteContent) => l.section_key === "email")
    : null;
  const rawEmail = emailRow?.description?.trim();
  const cleanEmail = rawEmail
    ? rawEmail.replace(/^(?:https?:\/\/|mailto:)+/i, "").trim()
    : "";
  const emailVal =
    cleanEmail && cleanEmail !== "#" ? cleanEmail : "lariojacflsv@gmail.com";

  return (
    <footer
      className="relative z-30 border-t border-white/10 bg-gradient-to-b from-larioja-azul to-larioja-azul-profundo text-white transition-colors"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Pie de página institucional
      </h2>

      <div className="mx-auto max-w-screen-xl px-4 py-16 lg:px-8 lg:py-20">
        {/* Cuadrícula de 4 columnas */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          
          {/* Columna 1: Identidad, Misión y Redes Oficiales (lg:col-span-4) */}
          <div className="flex flex-col justify-between lg:col-span-4">
            <div>
              <Link
                href="/"
                className="inline-flex items-center rounded-xl bg-white/95 px-3 py-1.5 shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-amarillo"
              >
                <Image
                  src="/logo.svg"
                  alt="La Rioja, Centro de Formación Laboral"
                  width={200}
                  height={60}
                  className="h-10 w-auto"
                />
              </Link>

              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">
                Formando jóvenes y adultos con discapacidad intelectual para el trabajo y la
                vida autónoma. Una obra comunitaria de <strong className="font-semibold text-white">ASPAPREM</strong> desde 1993.
              </p>
            </div>

            {/* Redes sociales oficiales */}
            <div className="mt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-larioja-amarillo">
                Conéctate con nosotros
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Instagram Oficial */}
                {igUrl && igUrl !== "#" && (
                  <OfficialSocialLink
                    href={igUrl}
                    label="Instagram oficial de La Rioja"
                    hoverColor="hover:text-pink-400 hover:border-pink-400/50"
                  >
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </OfficialSocialLink>
                )}

                {/* Facebook Oficial */}
                {fbUrl && fbUrl !== "#" && (
                  <OfficialSocialLink
                    href={fbUrl}
                    label="Facebook oficial de La Rioja"
                    hoverColor="hover:text-blue-400 hover:border-blue-400/50"
                  >
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </OfficialSocialLink>
                )}

                {/* YouTube Oficial */}
                {ytUrl && ytUrl !== "#" && (
                  <OfficialSocialLink
                    href={ytUrl}
                    label="Canal oficial de YouTube de La Rioja"
                    hoverColor="hover:text-red-500 hover:border-red-500/50"
                  >
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </OfficialSocialLink>
                )}

                {/* X / Twitter Oficial */}
                {xUrl && xUrl !== "#" && (
                  <OfficialSocialLink
                    href={xUrl}
                    label="X (Twitter) oficial de La Rioja"
                    hoverColor="hover:text-white hover:border-white/50"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </OfficialSocialLink>
                )}

                {/* WhatsApp Oficial */}
                {waUrl && waUrl !== "#" && (
                  <OfficialSocialLink
                    href={waUrl}
                    label="WhatsApp de contacto de La Rioja"
                    hoverColor="hover:text-emerald-400 hover:border-emerald-400/50"
                  >
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.303-.058.116-.087.188-.173.289l-.26.302c-.087.087-.179.182-.077.357.101.174.45 1.743 1.968 2.091.249.057.442.062.593.023.18-.047.411-.347.53-.491.119-.145.238-.116.357-.072.119.043.751.354.88.419.13.065.217.098.249.152.032.054.032.748-.112 1.153z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.557 4.115 1.528 5.845L.057 23.885a.5.5 0 00.593.661l6.159-1.614A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.961 9.961 0 01-5.09-1.396l-.364-.214-3.775.99.986-3.681-.236-.378A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                    </svg>
                  </OfficialSocialLink>
                )}
              </div>
            </div>
          </div>

          {/* Columna 2: Navegación Institucional (lg:col-span-2) */}
          <div className="lg:col-span-2">
            <p className="font-montserrat text-sm font-bold tracking-wider text-larioja-amarillo uppercase">
              Institución
            </p>
            <ul className="mt-4 space-y-2.5">
              {[
                { href: "/", label: "Inicio" },
                { href: "/about", label: "Quiénes Somos" },
                { href: "/programs", label: "Programas y Talleres" },
                ...(matriculaActive ? [{ href: "/matricula", label: "Matrícula" }] : []),
                { href: "/faq", label: "Preguntas Frecuentes" },
                { href: "/privacidad", label: "Política de privacidad" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-flex min-h-[44px] items-center text-sm text-white/75 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-larioja-amarillo"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Vías de Apoyo y Tienda Solidaria (lg:col-span-2) */}
          <div className="lg:col-span-2">
            <p className="font-montserrat text-sm font-bold tracking-wider text-larioja-amarillo uppercase">
              Participa
            </p>
            <ul className="mt-4 space-y-2.5">
              {[
                { href: "/apoyanos", label: "Apóyanos" },
                { href: "/bingo", label: "Gran Bingo Familiar" },
                { href: "/productos", label: "La Rioja Shop" },
                { href: "/programs#admision", label: "Inscripciones y Admisión" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-flex min-h-[44px] items-center text-sm text-white/75 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-larioja-amarillo"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 4: Contacto y Sede (Integración de teléfonos y dirección) (lg:col-span-4) */}
          <div className="lg:col-span-4">
            <p className="font-montserrat text-sm font-bold tracking-wider text-larioja-amarillo uppercase">
              Contacto y Sede
            </p>
            <div className="mt-4 space-y-3.5 text-sm text-white/80">
              
              {/* Dirección Física */}
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-larioja-amarillo" aria-hidden="true" />
                <div>
                  <p className="leading-snug text-white/90">{direccion}</p>
                  {mapsUrl && mapsUrl !== "#" && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-larioja-amarillo hover:underline"
                    >
                      Ver en Google Maps <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Teléfonos directos */}
              {(tel1 || tel2) && (
                <div className="flex items-center gap-3 pt-1">
                  <Phone className="h-5 w-5 shrink-0 text-larioja-amarillo" aria-hidden="true" />
                  <div className="flex flex-wrap items-center gap-x-2 text-white/90">
                    {tel1 && (
                      <a
                        href={`tel:${tel1}`}
                        className="inline-flex min-h-[44px] items-center hover:text-larioja-amarillo hover:underline"
                      >
                        {tel1}
                      </a>
                    )}
                    {tel2 && (
                      <>
                        <span aria-hidden="true" className="text-white/40">·</span>
                        <a
                          href={`tel:${tel2}`}
                          className="inline-flex min-h-[44px] items-center hover:text-larioja-amarillo hover:underline"
                        >
                          {tel2}
                        </a>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Correo Electrónico */}
              {emailVal && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 shrink-0 text-larioja-amarillo" aria-hidden="true" />
                  <a
                    href={`mailto:${emailVal}`}
                    className="inline-flex min-h-[44px] items-center text-xs text-white/90 hover:text-larioja-amarillo hover:underline sm:text-sm"
                  >
                    {emailVal}
                  </a>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Separador y Sub-footer con Copyright y Política de Privacidad */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-center text-xs text-white/60 sm:flex-row sm:text-left">
          <p>{copyrightText}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/privacidad"
              className="inline-flex min-h-[44px] items-center text-xs text-white/75 underline-offset-4 transition-colors hover:text-larioja-amarillo hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-larioja-amarillo"
            >
              Política de privacidad
            </Link>
            <span aria-hidden="true" className="text-white/30">·</span>
            <a
              href="#contenido"
              className="inline-flex min-h-[44px] items-center text-xs text-white/70 transition-colors hover:text-larioja-amarillo"
            >
              Volver arriba ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
