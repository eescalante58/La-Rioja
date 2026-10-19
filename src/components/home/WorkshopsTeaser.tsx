import Link from "next/link";
import type { SiteContent } from "@/types/cms";
import {
  metaHref,
  metaStrings,
  metaText,
  sectionImage,
  textOr,
  type CmsSection,
} from "@/lib/cms-content";
import { WorkshopPhoto } from "./WorkshopPhoto";

interface TallerItem {
  key: string;
  nombre: string;
  descripcion: string;
  foto: string;
  fotoAlt: string;
  insignia?: string;
  enlace?: string;
  enlaceTexto?: string;
  chips: string[];
  imageFit?: "auto" | "contain" | "cover";
}

interface Props {
  /** Fila encabezado `cl_workshops` (título, subtítulo y metadatos de sección). */
  workshops: SiteContent | null;
  /** Filas individuales `cl_workshop_1..N` de cada taller. */
  items?: SiteContent[];
  /** Etiqueta del enlace "Ver los N talleres" calculada a partir de getTalleres(). */
  talleresLabel?: string;
}

const TALLERES_BASE: TallerItem[] = [
  {
    key: "cl_workshop_1",
    nombre: "Panadería",
    descripcion:
      "Preparan masas, hornean y empacan pan dulce y salado siguiendo recetas e higiene de una panadería real.",
    foto: "/nosotros/taller-panaderia.webp",
    fotoAlt: "Alumnos amasando pan en el taller de Panadería",
    insignia: "Taller insignia",
    enlace: "/productos#panaderia",
    enlaceTexto: "Ver Panadería La Rioja →",
    chips: ["🥖 Pan francés", "🍞 Pan dulce", "🍪 galletas decoradas"],
  },
  {
    key: "cl_workshop_2",
    nombre: "Pintura",
    descripcion:
      "Diseñan y pintan a mano artículos personalizados, cuidando el detalle y el acabado de cada pieza.",
    foto: "/apoyanos/cltaller8Pintura.jpeg",
    fotoAlt: "Alumno pintando a mano en el taller de Pintura",
    insignia: "Taller Productivo",
    enlace: "/productos",
    enlaceTexto: "Ver en La Rioja Shop →",
    chips: ["🎨 Llaveros ilustrados", "🧢 gorras", "👕 camisetas, etc."],
  },
  {
    key: "cl_workshop_3",
    nombre: "Carpintería",
    descripcion:
      "Miden, cortan, lijan y ensamblan piezas de madera usando herramientas con técnicas seguras.",
    foto: "/nosotros/taller-carpinteria.webp",
    fotoAlt: "Alumno trabajando madera en el taller de Carpintería",
    insignia: "Taller Productivo",
    enlace: "/productos",
    enlaceTexto: "Ver en La Rioja Shop →",
    chips: ["📦 Cajas", "🪵 Repisas", "🪴 Artículos decorativos"],
  },
  {
    key: "cl_workshop_4",
    nombre: "Costura",
    descripcion:
      "Aprenden a usar la máquina de coser, cortar patrones y terminar prendas y accesorios textiles.",
    foto: "/nosotros/taller-costura.webp",
    fotoAlt: "Alumnas cosiendo en el taller de Costura",
    insignia: "Taller Productivo",
    enlace: "/productos#arte-y-costura",
    enlaceTexto: "Ver en La Rioja Shop →",
    chips: ["👜 Bolsas", "🧵 Accesorios textiles", "🪡 Arreglos"],
  },
];

/** Adapta `SiteContent` (`metadata: Json`) al contrato `CmsSection` (`metadata: Record<string, unknown>`). */
function toCmsSection(row: SiteContent | null | undefined): CmsSection | undefined {
  if (!row) return undefined;
  const meta =
    typeof row.metadata === "object" && row.metadata !== null && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : null;
  return {
    section_key: row.section_key,
    title: row.title,
    description: row.description,
    image_url: row.image_url,
    content_order: row.content_order,
    metadata: meta,
  };
}

/** Convierte una fila `cl_workshop_N` del CMS en un `TallerItem` con respaldos seguros. */
function rowToTallerItem(row: SiteContent, index: number): TallerItem | null {
  const sec = toCmsSection(row);
  if (!sec) return null;
  const base =
    TALLERES_BASE.find((b) => b.key === sec.section_key) ??
    TALLERES_BASE[index] ??
    TALLERES_BASE[0];
  const nombre = textOr(sec.title, base.nombre);
  if (!nombre) return null;

  const chips = metaStrings(sec, "chips");
  const rawFit = metaText(sec, "imageFit", metaText(sec, "tipo", "auto")).toLowerCase();
  const imageFit: "auto" | "contain" | "cover" =
    rawFit === "contain" || rawFit === "vertical" || rawFit === "afiche"
      ? "contain"
      : rawFit === "cover" || rawFit === "horizontal"
        ? "cover"
        : "auto";

  return {
    key: sec.section_key,
    nombre,
    descripcion: textOr(sec.description, base.descripcion),
    foto: sectionImage(sec) ?? base.foto,
    fotoAlt: metaText(sec, "foto_alt", base.fotoAlt || `Estudiantes en el taller de ${nombre}`),
    insignia: metaText(sec, "insignia", base.insignia ?? "Taller Productivo"),
    enlace: metaHref(sec, "enlace", base.enlace ?? "/productos"),
    enlaceTexto: metaText(sec, "enlace_texto", base.enlaceTexto ?? "Ver en La Rioja Shop →"),
    chips: chips.length > 0 ? chips : base.chips,
    imageFit,
  };
}

/**
 * Sección 5 de Inicio — Cuadrícula 2×2 de talleres vocacionales.
 * Encabezado en `cl_workshops` y tarjetas individuales en `cl_workshop_1..N`.
 */
export function WorkshopsTeaser({ workshops, items = [], talleresLabel }: Props) {
  const headerSec = toCmsSection(workshops);
  const fromSections = items
    .map((row, idx) => rowToTallerItem(row, idx))
    .filter((t): t is TallerItem => t !== null);

  const talleres: TallerItem[] = fromSections.length > 0 ? fromSections : TALLERES_BASE;

  const eyebrow = metaText(headerSec, "antetitulo", "Formación Vocacional");
  const heading = textOr(headerSec?.title, "Aprender haciendo");
  const subheading = textOr(
    headerSec?.description,
    "Cada taller es un espacio de trabajo real. Los productos que ves son hechos por nuestros estudiantes.",
  );
  const ctaHref = metaHref(headerSec, "enlace", "/programs#talleres");
  const ctaLabel = metaText(
    headerSec,
    "boton",
    talleresLabel ?? "Ver los cuatro talleres",
  );

  return (
    <section
      id="seccion-talleres"
      className="bg-white py-16 dark:bg-slate-950 lg:py-20"
      aria-labelledby="workshops-heading"
    >
      <div className="mx-auto max-w-screen-xl px-4 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-larioja-azul dark:text-sky-400">
              <span aria-hidden="true">🛠️</span> {eyebrow}
            </div>
            <h2
              id="workshops-heading"
              className="font-montserrat text-2xl font-extrabold text-larioja-azul dark:text-larioja-amarillo sm:text-3xl"
            >
              {heading}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-ink-muted dark:text-slate-400">
              {subheading}
            </p>
          </div>
          <Link
            href={ctaHref}
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-full border-2 border-larioja-azul px-5 py-2.5 text-xs font-bold text-larioja-azul transition-colors hover:bg-larioja-azul hover:text-white dark:border-larioja-amarillo dark:text-larioja-amarillo dark:hover:bg-larioja-amarillo dark:hover:text-larioja-azul"
          >
            {ctaLabel} →
          </Link>
        </div>

        {/* Cuadrícula 2x2 de los 4 Talleres (imagen arriba sin superposición + cuerpo de texto debajo) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {talleres.map((taller) => (
            <article
              key={taller.key}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl dark:border-slate-800"
            >
              <WorkshopPhoto
                src={taller.foto}
                alt={taller.fotoAlt}
                insignia={taller.insignia}
                nombre={taller.nombre}
                enlace={taller.enlace}
                enlaceTexto={taller.enlaceTexto}
                imageFit={taller.imageFit}
              />

              <div className="flex flex-1 flex-col justify-between p-6 text-white">
                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-montserrat text-xl font-extrabold text-white">
                      {taller.nombre}
                    </h3>
                    {taller.enlace && (
                      <Link
                        href={taller.enlace}
                        className="inline-flex min-h-[44px] -my-2 shrink-0 items-center gap-1 text-xs font-semibold text-larioja-amarillo hover:underline"
                      >
                        {taller.enlaceTexto || "Ver en La Rioja Shop →"}
                      </Link>
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-white/85 sm:text-sm">
                    {taller.descripcion}
                  </p>
                </div>

                {/* Chips de productos */}
                {taller.chips && taller.chips.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-white/15 pt-3.5">
                    <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-white/60">
                      Productos:
                    </span>
                    {taller.chips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/25"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
