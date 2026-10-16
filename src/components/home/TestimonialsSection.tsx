import Image from "next/image";
import type { SiteContent } from "@/types/cms";

interface Props {
  testimonial1: SiteContent | null;
  testimonial2: SiteContent | null;
}

interface CardProps {
  testimonial: SiteContent;
}

function TestimonialCard({ testimonial }: CardProps) {
  const meta = (testimonial.metadata ?? {}) as Record<string, unknown>;
  const quote = (meta.quote as string) ?? testimonial.description ?? "";
  const nombre = (meta.nombre as string) ?? "";
  const rol = (meta.rol as string) ?? "";
  const photoUrl = meta.photoUrl as string | undefined;

  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <div>
        <svg
          className="mb-4 h-8 w-8 text-larioja-amarillo"
          fill="currentColor"
          viewBox="0 0 32 32"
          aria-hidden="true"
        >
          <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
        </svg>

        <blockquote>
          <p className="text-sm italic leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base">
            &ldquo;{quote}&rdquo;
          </p>
        </blockquote>
      </div>

      <div className="mt-6 flex items-center gap-3.5 border-t border-slate-100 pt-4 dark:border-slate-800">
        {photoUrl && (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-larioja-amarillo sm:h-14 sm:w-14">
            <Image
              src={photoUrl}
              alt={`Foto de ${nombre}`}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
        )}
        <div>
          <p className="font-montserrat font-bold text-slate-900 dark:text-white">
            {nombre}
          </p>
          {rol && <p className="text-xs text-ink-muted dark:text-slate-400">{rol}</p>}
        </div>
      </div>
    </div>
  );
}

/**
 * Sección 8 — Testimonios de la comunidad.
 * Muestra los testimonios registrados en Supabase CMS cuando metadata.visible === true.
 * Con un solo testimonio activo: centrado ancho completo.
 * Con ambos activos: cuadrícula responsive de dos columnas.
 */
export function TestimonialsSection({ testimonial1, testimonial2 }: Props) {
  const meta1 = (testimonial1?.metadata ?? {}) as Record<string, unknown>;
  const meta2 = (testimonial2?.metadata ?? {}) as Record<string, unknown>;

  const show1 = !!meta1.visible;
  const show2 = !!meta2.visible;

  if (!show1 && !show2) return null;

  const both = show1 && show2;

  return (
    <section
      id="seccion-testimonios"
      className="border-t border-slate-200/60 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/50 lg:py-20"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-screen-xl px-4 lg:px-8">
        <div className="mb-8 text-center">
          <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-larioja-azul dark:text-sky-400">
            <span aria-hidden="true">💬</span> Historias de Vida
          </div>
          <h2
            id="testimonials-heading"
            className="font-montserrat text-2xl font-extrabold text-larioja-azul dark:text-larioja-amarillo sm:text-3xl"
          >
            Historias que nos impulsan
          </h2>
          <p className="mx-auto mt-1 max-w-lg text-xs text-ink-muted dark:text-slate-400 sm:text-sm">
            La voz de nuestras familias y de la comunidad que nos acompaña día a día.
          </p>
        </div>

        {both ? (
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:gap-8">
            <TestimonialCard testimonial={testimonial1!} />
            <TestimonialCard testimonial={testimonial2!} />
          </div>
        ) : (
          <div className="mx-auto max-w-2xl">
            {show1 && <TestimonialCard testimonial={testimonial1!} />}
            {show2 && <TestimonialCard testimonial={testimonial2!} />}
          </div>
        )}
      </div>
    </section>
  );
}
