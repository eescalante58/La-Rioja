import { UserRound } from "lucide-react";
import { textOr, type CmsSection } from "@/lib/cms-content";
import { H3, MUTED } from "@/components/site/section-ui";

interface TeamGridProps {
  /** Fila `cl_equipo` (H3 + texto). */
  intro: CmsSection | undefined;
  /** Filas `cl_rol_N`. */
  roles: CmsSection[];
}

/**
 * «Nuestro equipo»: tarjetas por rol. Sin fotos de personas: solo se
 * publican con autorización (política de imágenes de La Rioja).
 */
export function TeamGrid({ intro, roles }: TeamGridProps) {
  const items = roles.filter((r) => textOr(r.title, ""));
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className={`${H3} m-0`}>{textOr(intro?.title, "Nuestro equipo")}</h3>
        {intro?.description && <p className={`m-0 text-base ${MUTED}`}>{intro.description}</p>}
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((r) => (
          <article
            key={r.section_key}
            className="flex flex-col gap-2.5 rounded-[18px] border border-line bg-white p-6 dark:bg-surface-card"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#F3F5F8] text-larioja-azul dark:bg-white/10 dark:text-white">
              <UserRound size={24} aria-hidden="true" />
            </span>
            <h4 className="m-0 font-montserrat text-lg font-bold text-larioja-azul dark:text-white">
              {r.title}
            </h4>
            {r.description && (
              <p className={`m-0 text-[15px] leading-relaxed ${MUTED}`}>{r.description}</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
