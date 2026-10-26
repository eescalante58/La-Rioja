import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, MessageSquare } from "lucide-react";
import { WhatsAppIcon } from "@/components/layout/WhatsAppIcon";
import { MatriculaCuposBadge } from "./MatriculaCuposBadge";
import type { SiteContent } from "@/types/cms";
import type { MatriculaCuposConfig } from "@/lib/validation/matricula";

interface MatriculaHeroProps {
  heroSection: SiteContent | null;
  cuposSection: SiteContent | null;
  admissionYear: number;
  onOpenModal: () => void;
}

export function MatriculaHero({
  heroSection,
  cuposSection,
  admissionYear,
  onOpenModal,
}: MatriculaHeroProps) {
  if (!heroSection || !heroSection.is_active) {
    return null;
  }

  const meta = (heroSection.metadata || {}) as Record<string, unknown>;
  const cuposMeta = (cuposSection?.metadata || null) as MatriculaCuposConfig | null;

  const rawTitle = heroSection.title || "MATRÍCULA {year}";
  const title = rawTitle.replace(/\{year\}/g, String(admissionYear));

  const description =
    heroSection.description ||
    "Educación y formación laboral para personas con discapacidad intelectual.";

  const eyebrow = (meta.eyebrow as string) || "Admisiones Abiertas";
  const ctaLabel = (meta.cta_label as string) || "Consultar por WhatsApp";
  const ctaAriaLabel = (meta.cta_aria_label as string) || "Consultar por WhatsApp sobre matrícula";
  const secondaryLabel = (meta.secondary_label as string) || "Conoce el proceso";
  const secondaryAnchor = (meta.secondary_anchor as string) || "#proceso";
  const imageAlt = (meta.image_alt as string) || "Comunidad educativa La Rioja";
  const imageUrl = heroSection.image_url || "/logo.svg";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-larioja-azul to-larioja-azul-profundo py-12 sm:py-16 lg:py-24 text-white">
      {/* Fondo decorativo sutil */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Columna de Texto */}
          <div className="flex flex-col items-start gap-5 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-3">
              {eyebrow && (
                <span className="rounded-full bg-white/10 px-3.5 py-1 font-montserrat text-xs font-bold uppercase tracking-wider text-larioja-amarillo backdrop-blur-sm border border-white/10">
                  {eyebrow}
                </span>
              )}
              {/* Insignia de cupos compuesta en el Hero */}
              <MatriculaCuposBadge
                cuposConfig={cuposMeta}
                titleTemplate={cuposSection?.title}
              />
            </div>

            <h1 className="font-montserrat text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1] text-white">
              {title}
            </h1>

            <p className="font-inter max-w-2xl text-base sm:text-lg leading-relaxed text-white/90">
              {description}
            </p>

            {/* Acciones principales */}
            <div className="mt-2 flex w-full flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button
                type="button"
                onClick={onOpenModal}
                aria-label={ctaAriaLabel}
                className="inline-flex min-h-[50px] items-center justify-center gap-2.5 rounded-full bg-emerald-600 px-7 py-3.5 font-montserrat text-sm font-bold text-white shadow-lg transition-all hover:bg-emerald-500 hover:shadow-xl active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
              >
                <WhatsAppIcon className="h-5 w-5 fill-current" />
                <span>{ctaLabel}</span>
              </button>

              {secondaryLabel && (
                <a
                  href={secondaryAnchor}
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3.5 font-montserrat text-sm font-semibold text-white transition-all hover:bg-white/15 hover:border-white/40 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-yellow"
                >
                  <span>{secondaryLabel}</span>
                  <ArrowDown size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Columna de Imagen */}
          <div className={`lg:col-span-5 ${meta.image_position === "left" ? "lg:order-first" : ""}`}>
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-2xl backdrop-blur-sm">
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  fill
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  priority
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
