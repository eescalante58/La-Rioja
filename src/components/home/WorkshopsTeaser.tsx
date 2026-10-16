import Image from "next/image";
import Link from "next/link";
import type { SiteContent } from "@/types/cms";

interface TallerItem {
  nombre: string;
  descripcion: string;
  foto: string;
  fotoAlt: string;
  insignia?: string;
  enlace?: string;
  enlaceTexto?: string;
  chips: string[];
}

interface Props {
  workshops: SiteContent | null;
  /** Etiqueta del enlace "Ver los N talleres" calculada a partir de getTalleres(). */
  talleresLabel?: string;
}

const TALLERES_BASE: TallerItem[] = [
  {
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
    nombre: "Pintura",
    descripcion:
      "Diseñan y pintan a mano artículos personalizados, cuidando el detalle y el acabado de cada pieza.",
    foto: "/apoyanos/logro-pintura.webp",
    fotoAlt: "Alumno pintando a mano en el taller de Pintura",
    insignia: "Taller Productivo",
    enlace: "/productos",
    enlaceTexto: "Ver en La Rioja Shop →",
    chips: ["🎨 Llaveros ilustrados", "🧢 gorras", "👕 camisetas, etc."],
  },
  {
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

export function WorkshopsTeaser({ workshops, talleresLabel }: Props) {
  const meta = (workshops?.metadata ?? {}) as Record<string, unknown>;
  const rawTalleres = Array.isArray(meta.talleres) ? (meta.talleres as Partial<TallerItem>[]) : [];

  // Combinar inteligentemente con los datos de Supabase si existen, preservando siempre los 4 talleres y sus chips
  const talleres: TallerItem[] = TALLERES_BASE.map((base) => {
    const fromCms = rawTalleres.find(
      (t) =>
        t.nombre &&
        (t.nombre.toLowerCase().includes(base.nombre.toLowerCase()) ||
          base.nombre.toLowerCase().includes(t.nombre.toLowerCase())),
    );

    if (!fromCms) return base;

    return {
      nombre: base.nombre === "Pintura" ? "Pintura" : (fromCms.nombre ?? base.nombre),
      descripcion: fromCms.descripcion || base.descripcion,
      foto: ((fromCms as Record<string, unknown>).foto as string) || base.foto,
      fotoAlt:
        ((fromCms as Record<string, unknown>).foto_alt as string) ||
        fromCms.fotoAlt ||
        base.fotoAlt,
      insignia: fromCms.insignia || base.insignia,
      enlace: fromCms.enlace || base.enlace,
      enlaceTexto:
        fromCms.enlaceTexto ||
        ((fromCms as Record<string, unknown>).enlace_texto as string) ||
        base.enlaceTexto,
      chips:
        Array.isArray(fromCms.chips) && fromCms.chips.length > 0
          ? (fromCms.chips as string[])
          : base.chips,
    };
  });

  const heading = workshops?.title || "Aprender haciendo";
  const subheading =
    workshops?.description ||
    "Cada taller es un espacio de trabajo real. Los productos que ves son hechos por nuestros estudiantes.";
  const ctaLabel = talleresLabel ?? "Ver los cuatro talleres";

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
              <span aria-hidden="true">🛠️</span> Formación Vocacional
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
            href="/programs#talleres"
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-full border-2 border-larioja-azul px-5 py-2.5 text-xs font-bold text-larioja-azul transition-colors hover:bg-larioja-azul hover:text-white dark:border-larioja-amarillo dark:text-larioja-amarillo dark:hover:bg-larioja-amarillo dark:hover:text-larioja-azul"
          >
            {ctaLabel} →
          </Link>
        </div>

        {/* Cuadrícula 2x2 Bento Grid de los 4 Talleres */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {talleres.map((taller) => (
            <article
              key={taller.nombre}
              className="group relative flex min-h-[350px] flex-col justify-end overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl dark:border-slate-800"
            >
              <Image
                src={taller.foto}
                alt={taller.fotoAlt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent" />

              <div className="relative p-6 text-white backdrop-blur-[1px]">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="inline-block rounded-full bg-larioja-amarillo px-3 py-0.5 text-[11px] font-extrabold text-larioja-azul shadow-xs">
                    {taller.insignia || "Taller Productivo"}
                  </span>
                  {taller.enlace && (
                    <Link
                      href={taller.enlace}
                      className="flex items-center gap-1 text-xs font-semibold text-larioja-amarillo hover:underline"
                    >
                      {taller.enlaceTexto || "Ver en La Rioja Shop →"}
                    </Link>
                  )}
                </div>

                <h3 className="font-montserrat text-xl font-extrabold text-white">
                  {taller.nombre}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-white/80">
                  {taller.descripcion}
                </p>

                {/* Chips de productos */}
                {taller.chips && taller.chips.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/20 pt-3">
                    <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-white/60">
                      Productos:
                    </span>
                    {taller.chips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
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
