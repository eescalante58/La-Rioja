import Image from "next/image";
import Link from "next/link";
import type { SiteContent } from "@/types/cms";

interface Props {
  hero: SiteContent | null;
}

/** Sección 1 — Hero principal de la portada. */
export function HomeHero({ hero }: Props) {
  const meta = (hero?.metadata ?? {}) as Record<string, unknown>;

  const antetitulo = (meta.antetitulo as string) ?? "Desde 1993 · ASPAPREM";
  const title = hero?.title ?? "Formando futuros, integrando vidas";
  const description =
    hero?.description ??
    "En el Centro de Formación Laboral La Rioja, jóvenes y adultos con discapacidad intelectual aprenden un oficio, ganan autonomía y construyen su lugar en la sociedad.";
  const btn1 = (meta.boton_1 as string) ?? "Conoce nuestros programas";
  const href1 = (meta.enlace_1 as string) ?? "/programs";
  const btn2 = (meta.boton_2 as string) ?? "Apóyanos";
  const href2 = (meta.enlace_2 as string) ?? "/apoyanos";
  const imgSrc = hero?.image_url ?? "/nosotros/hero-estudiantes.webp";
  const imgAlt = (meta.foto_alt as string) ?? "Estudiantes de La Rioja en el taller";

  const socialDestacado = (meta.prueba_social_destacado as string) ?? "+30 escuelas";
  const socialTexto =
    (meta.prueba_social_texto as string) ??
    "articuladas con formación avalada por la Dirección de Educación.";
  const socialBadges =
    Array.isArray(meta.prueba_social_badges) && meta.prueba_social_badges.length > 0
      ? (meta.prueba_social_badges as string[])
      : ["33a", "52+", "20p"];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-larioja-azul to-larioja-azul-profundo text-white">
      {/* Luz decorativa sutil de fondo */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto grid max-w-screen-xl items-center gap-10 px-4 py-14 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-20">
        {/* Columna de texto */}
        <div className="flex flex-col items-start gap-5 lg:col-span-7">
          {/* Badge antetítulo con contraste óptimo WCAG 2.2 */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-yellow-300 shadow-xs backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" aria-hidden="true" />
            {antetitulo}
          </div>

          <h1 className="font-montserrat text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
            {title}
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-white/85 lg:text-lg">
            {description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={href1}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-larioja-amarillo px-7 py-3 text-sm font-bold text-larioja-azul shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-amarillo focus-visible:ring-offset-2 focus-visible:ring-offset-larioja-azul"
            >
              {btn1}
            </Link>
            <Link
              href={href2}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border-2 border-white/70 px-7 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white/10 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-larioja-azul"
            >
              {btn2}
            </Link>
          </div>

          {/* Prueba social inmediata (parametrizada desde el CMS) */}
          <div className="flex items-center gap-3.5 border-t border-white/15 pt-4 text-xs text-white/80">
            <div className="flex -space-x-2" aria-hidden="true">
              {socialBadges.map((badge, idx) => {
                const badgeColors = [
                  "bg-amber-400 text-larioja-azul",
                  "bg-blue-400 text-larioja-azul",
                  "bg-emerald-400 text-larioja-azul",
                ];
                return (
                  <span
                    key={`${badge}-${idx}`}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-larioja-azul text-[11px] font-bold ${badgeColors[idx % badgeColors.length]}`}
                  >
                    {badge}
                  </span>
                );
              })}
            </div>
            <p className="leading-tight">
              <strong className="font-semibold text-white">{socialDestacado}</strong> {socialTexto}
            </p>
          </div>
        </div>

        {/* Imagen principal */}
        <div className="order-first lg:order-last lg:col-span-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border-4 border-white/10 bg-slate-800 shadow-2xl">
            <Image
              src={imgSrc}
              alt={imgAlt}
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-larioja-azul-profundo/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/20 bg-white/15 p-3 text-white backdrop-blur-md">
              <div>
                <p className="text-xs font-bold">Comunidad La Rioja</p>
                <p className="text-[11px] text-white/80">Educación, taller y convivencia</p>
              </div>
              <span className="rounded-full bg-larioja-amarillo px-2.5 py-1 text-xs font-extrabold text-larioja-azul">
                ASPAPREM
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
