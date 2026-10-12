import Image from "next/image";
import Link from "next/link";
import type { SiteContent } from "@/types/cms";

interface Taller {
  nombre: string;
  descripcion: string;
  foto: string;
  fotoAlt: string;
  whatsapp?: string;
}

interface Props {
  workshops: SiteContent | null;
}

const TALLERES_FALLBACK: Taller[] = [
  {
    nombre: "Panadería y Pastelería",
    descripcion:
      "Nuestros estudiantes hornean pan artesanal, facturas y tortas que se venden en la institución cada semana.",
    foto: "/talleres/panaderia.webp",
    fotoAlt: "Estudiante amasando pan en el taller de panadería",
  },
  {
    nombre: "Costura y Confección",
    descripcion:
      "Diseño, corte y confección de prendas. Del hilo a la prenda terminada, con técnica y creatividad.",
    foto: "/talleres/costura.webp",
    fotoAlt: "Estudiante cosiendo en máquina en el taller de costura",
  },
  {
    nombre: "Carpintería",
    descripcion:
      "Muebles, marcos y objetos de madera elaborados con precisión en nuestro taller equipado.",
    foto: "/talleres/carpinteria.webp",
    fotoAlt: "Estudiante lijando una pieza de madera en el taller de carpintería",
  },
];

/** Sección 5 — Talleres productivos. Bento grid: panadería grande, costura y carpintería a la derecha. */
export function WorkshopsTeaser({ workshops }: Props) {
  const meta = (workshops?.metadata ?? {}) as Record<string, unknown>;
  const talleres: Taller[] = (meta.talleres as Taller[]) ?? TALLERES_FALLBACK;
  const whatsappGeneral =
    (meta.whatsapp as string) ??
    "https://wa.me/5493624000000?text=Hola%2C%20quisiera%20información%20sobre%20los%20talleres";

  const [grande, ...resto] = talleres;

  return (
    <section className="bg-surface-page py-16 lg:py-20" aria-labelledby="workshops-heading">
      <div className="mx-auto max-w-screen-xl px-4 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="workshops-heading"
              className="font-montserrat text-2xl font-extrabold text-larioja-azul dark:text-larioja-amarillo lg:text-3xl"
            >
              Aprender haciendo
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Cada taller es un espacio de trabajo real. Los productos que ves son hechos por
              nuestros estudiantes.
            </p>
          </div>
          <Link
            href={whatsappGeneral}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full border-2 border-larioja-verde px-5 py-2 text-sm font-bold text-larioja-verde transition-colors hover:bg-larioja-verde hover:text-white dark:border-larioja-amarillo dark:text-larioja-amarillo dark:hover:bg-larioja-amarillo dark:hover:text-larioja-azul"
          >
            Consultar por WhatsApp →
          </Link>
        </div>

        {/* Bento grid */}
        <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
          {/* Tarjeta grande: ocupa col 1–2 y las 2 filas en desktop */}
          {grande && (
            <article className="group relative overflow-hidden rounded-tile md:col-span-2 md:row-span-2">
              <div className="relative h-64 md:h-full">
                <Image
                  src={grande.foto}
                  alt={grande.fotoAlt}
                  fill
                  sizes="(max-width: 767px) 100vw, 66vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <span className="mb-2 inline-block rounded-full bg-larioja-amarillo px-3 py-1 text-xs font-bold text-larioja-azul">
                  Hecho por nuestros estudiantes
                </span>
                <h3 className="font-montserrat text-xl font-extrabold">{grande.nombre}</h3>
                <p className="mt-1 text-sm text-white/80">{grande.descripcion}</p>
              </div>
            </article>
          )}

          {/* Tarjetas pequeñas */}
          {resto.map((t) => (
            <article key={t.nombre} className="group relative overflow-hidden rounded-tile">
              <div className="relative aspect-[16/10]">
                <Image
                  src={t.foto}
                  alt={t.fotoAlt}
                  fill
                  sizes="(max-width: 767px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="font-montserrat text-base font-bold">{t.nombre}</h3>
                <p className="mt-0.5 text-xs text-white/75">{t.descripcion}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
