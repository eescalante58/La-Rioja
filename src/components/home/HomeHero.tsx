import Image from "next/image";
import Link from "next/link";
import type { SiteContent } from "@/types/cms";

interface Props {
  hero: SiteContent | null;
}

/** Sección 1 — Hero principal de la portada. */
export function HomeHero({ hero }: Props) {
  const meta = (hero?.metadata ?? {}) as Record<string, string>;

  const antetitulo = meta.antetitulo ?? "Desde 1993 · ASPAPREM";
  const title = hero?.title ?? "Formando futuros, integrando vidas";
  const description =
    hero?.description ??
    "En el Centro de Formación Laboral La Rioja, jóvenes y adultos con discapacidad intelectual aprenden un oficio, ganan autonomía y construyen su lugar en la sociedad.";
  const btn1 = meta.boton_1 ?? "Conoce nuestros programas";
  const href1 = meta.enlace_1 ?? "/programs";
  const btn2 = meta.boton_2 ?? "Apóyanos";
  const href2 = meta.enlace_2 ?? "/apoyanos";
  const imgSrc = hero?.image_url ?? "/nosotros/hero-estudiantes.webp";
  const imgAlt = meta.foto_alt ?? "Estudiantes de La Rioja en el taller";

  return (
    <section className="bg-larioja-azul text-white">
      <div className="mx-auto grid max-w-screen-xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        {/* Texto */}
        <div className="flex flex-col gap-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-larioja-amarillo/80">
            {antetitulo}
          </p>
          <h1 className="font-montserrat text-4xl font-extrabold leading-tight lg:text-5xl xl:text-6xl">
            {title}
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-white/85 lg:text-lg">
            {description}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={href1}
              className="rounded-full bg-larioja-amarillo px-6 py-3 text-sm font-bold text-larioja-azul transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-amarillo focus-visible:ring-offset-2 focus-visible:ring-offset-larioja-azul"
            >
              {btn1}
            </Link>
            <Link
              href={href2}
              className="rounded-full border-2 border-white/70 px-6 py-3 text-sm font-bold text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-larioja-azul"
            >
              {btn2}
            </Link>
          </div>
        </div>

        {/* Imagen */}
        <div className="order-first lg:order-last">
          <div className="relative aspect-[3/2] overflow-hidden rounded-2xl shadow-2xl">
            <Image
              src={imgSrc}
              alt={imgAlt}
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
