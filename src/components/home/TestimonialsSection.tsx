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
    <div className="flex flex-col items-center text-center px-4 py-2">
      <svg
        className="mx-auto mb-4 h-8 w-8 text-larioja-amarillo"
        fill="currentColor"
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
      </svg>

      <blockquote>
        <p className="text-base leading-relaxed text-ink italic lg:text-lg">
          &ldquo;{quote}&rdquo;
        </p>
      </blockquote>

      <div className="mt-6 flex flex-col items-center gap-3">
        {photoUrl && (
          <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-larioja-amarillo">
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
          <p className="font-montserrat font-bold text-larioja-azul dark:text-larioja-amarillo">
            {nombre}
          </p>
          {rol && <p className="text-xs text-ink-muted">{rol}</p>}
        </div>
      </div>
    </div>
  );
}

/**
 * Sección 8 — Uno o dos testimonios.
 * Con un solo testimonio activo: centrado ancho completo (igual que antes).
 * Con ambos activos: dos columnas lado a lado separadas por un divisor.
 */
export function TestimonialsSection({ testimonial1, testimonial2 }: Props) {
  const meta1 = (testimonial1?.metadata ?? {}) as Record<string, unknown>;
  const meta2 = (testimonial2?.metadata ?? {}) as Record<string, unknown>;

  const show1 = !!meta1.visible;
  const show2 = !!meta2.visible;

  if (!show1 && !show2) return null;

  const both = show1 && show2;

  return (
    <section className="bg-surface-page py-16 lg:py-20" aria-label="Testimonios">
      <div className="mx-auto max-w-screen-xl px-4 lg:px-8">
        {both ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-0 items-start">
            <div className="md:border-r md:border-gray-200 dark:md:border-gray-700 md:pr-8">
              <TestimonialCard testimonial={testimonial1!} />
            </div>
            <div className="md:pl-8">
              <TestimonialCard testimonial={testimonial2!} />
            </div>
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
