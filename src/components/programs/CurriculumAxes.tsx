import { FileText } from "lucide-react";
import { MUTED } from "@/components/site/section-ui";
import type { CurriculumAxis } from "./types";

interface CurriculumAxesProps {
  title: string;
  /** Nota al pie (p. ej. educación física en formación integral). */
  note: string;
  axes: CurriculumAxis[];
  /** Enlace opcional al plan de estudios completo (PDF). */
  pdf?: { label: string; href: string };
}

/** «Lo que se trabaja en todos los niveles»: cuatro tarjetas de ejes curriculares. */
export function CurriculumAxes({ title, note, axes, pdf }: CurriculumAxesProps) {
  if (axes.length === 0) return null;

  return (
    <div className="flex flex-col gap-5 pt-3">
      <h3 className="m-0 font-montserrat text-[22px] font-bold text-larioja-azul md:text-2xl dark:text-white">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {axes.map((a) => (
          <article
            key={a.key}
            className="flex flex-col gap-2 rounded-[18px] bg-white p-6 dark:bg-surface-card"
          >
            {a.area && (
              <p className="m-0 text-xs font-bold uppercase tracking-[0.06em] text-larioja-verde-texto dark:text-larioja-verde">
                {a.area}
              </p>
            )}
            <h4 className="m-0 font-montserrat text-[19px] font-bold text-larioja-azul dark:text-white">
              {a.name}
            </h4>
            {a.text && <p className={`m-0 text-[15px] leading-relaxed ${MUTED}`}>{a.text}</p>}
          </article>
        ))}
      </div>
      {note && <p className={`m-0 text-[15px] leading-relaxed ${MUTED}`}>{note}</p>}
      {pdf && (
        <a
          href={pdf.href}
          className="inline-flex min-h-[44px] items-center gap-2 self-start font-montserrat text-[15px] font-bold text-larioja-azul-enlace underline-offset-4 hover:underline dark:text-larioja-amarillo"
        >
          <FileText size={18} aria-hidden="true" />
          {pdf.label}
        </a>
      )}
    </div>
  );
}
