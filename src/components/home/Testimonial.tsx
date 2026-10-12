import Image from "next/image";
import type { SiteContent } from "@/types/cms";

interface Props {
  testimonial: SiteContent | null;
}

/**
 * Sección 8 — Testimonio de familia o egresado.
 * Solo se renderiza si metadata.visible === true.
 */
export function Testimonial({ testimonial }: Props) {
  const meta = (testimonial?.metadata ?? {}) as Record<string, unknown>;

  if (!meta.visible) return null;

  const quote = (meta.quote as string) ?? testimonial?.description ?? "";
  const nombre = (meta.nombre as string) ?? "";
  const rol = (meta.rol as string) ?? "";
  const photoUrl = meta.photoUrl as string | undefined;

  return (
    <section className="bg-surface-page py-16 lg:py-20" aria-label="Testimonio">
      <div className="mx-auto max-w-screen-xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          {/* Comillas decorativas */}
          <svg
            className="mx-auto mb-4 h-10 w-10 text-larioja-amarillo"
            fill="currentColor"
            viewBox="0 0 32 32"
            aria-hidden="true"
          >
            <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
          </svg>

          <blockquote>
            <p className="text-lg leading-relaxed text-ink italic lg:text-xl">
              &ldquo;{quote}&rdquo;
            </p>
          </blockquote>

          {/* Autor */}
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
      </div>
    </section>
  );
}
