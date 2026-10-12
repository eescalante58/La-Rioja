import { z } from "zod";
import { metaText, textOr, type CmsSection } from "@/lib/cms-content";
import { orgBranchSchema } from "@/lib/validation/cms";
import { H3 } from "@/components/site/section-ui";

interface OrgChartProps {
  /** Fila `cl_estructura` (H3 y nodos del organigrama en metadata). */
  structure: CmsSection | undefined;
}

/** Línea vertical decorativa entre niveles del organigrama. */
function Connector() {
  return <li aria-hidden="true" className="h-6 w-0.5 bg-larioja-azul dark:bg-white/50" />;
}

/**
 * «Cómo nos organizamos»: organigrama de ASPAPREM en listas anidadas
 * (Asamblea → Junta Directiva → ramas con sus unidades) y, al costado, el
 * contador y auditor externo con la insignia «Rendición de cuentas».
 */
export function OrgChart({ structure }: OrgChartProps) {
  if (!structure) return null;
  const assembly = metaText(structure, "asamblea", "");
  const board = metaText(structure, "junta", "");
  const branches = z
    .array(orgBranchSchema)
    .catch([])
    .parse(structure.metadata?.ramas ?? []);
  const auditor = metaText(structure, "auditor", "");
  const auditorText = metaText(structure, "auditor_texto", "");
  const auditorBadge = metaText(structure, "auditor_insignia", "");
  if (!assembly && !board && branches.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      <h3 className={`${H3} m-0`}>{textOr(structure.title, "Cómo nos organizamos")}</h3>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <ul
          aria-label="Estructura de gobierno de ASPAPREM"
          className="m-0 flex min-w-0 list-none flex-col items-center p-0 lg:basis-[70%]"
        >
          {assembly && (
            <li className="w-full max-w-[420px] rounded-2xl bg-larioja-azul px-5 py-4 text-center text-white dark:border dark:border-white/20 dark:bg-larioja-azul-profundo">
              <strong className="font-montserrat text-[17px]">{assembly}</strong>
              {metaText(structure, "asamblea_texto", "") && (
                <span className="block text-[13px] text-white/85">
                  {metaText(structure, "asamblea_texto", "")}
                </span>
              )}
            </li>
          )}
          {assembly && board && <Connector />}
          {board && (
            <li className="w-full max-w-[420px] rounded-2xl border-2 border-larioja-azul bg-white px-5 py-4 text-center dark:border-white/50 dark:bg-surface-card">
              <strong className="font-montserrat text-[17px] text-larioja-azul dark:text-white">
                {board}
              </strong>
              {metaText(structure, "junta_texto", "") && (
                <span className="block text-[13px] text-gray-600 dark:text-white/70">
                  {metaText(structure, "junta_texto", "")}
                </span>
              )}
            </li>
          )}
          {branches.length > 0 && (
            <>
              <Connector />
              <li className="w-full">
                <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
                  {branches.map((b) => (
                    <li
                      key={b.nombre}
                      className="flex flex-col gap-2.5 rounded-2xl bg-[#F3F5F8] px-5 py-4 dark:bg-slate-900/60"
                    >
                      <strong className="text-center font-montserrat text-base text-larioja-azul dark:text-white">
                        {b.nombre}
                      </strong>
                      {b.unidades.length > 0 && (
                        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                          {b.unidades.map((u) => (
                            <li
                              key={u}
                              className="rounded-[10px] bg-white px-3 py-2.5 text-center text-sm text-larioja-azul dark:bg-surface-card dark:text-white/90"
                            >
                              {u}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            </>
          )}
        </ul>

        {auditor && (
          <aside className="flex flex-col gap-2.5 rounded-[18px] border-2 border-dashed border-larioja-verde-texto p-[22px] dark:border-larioja-verde lg:basis-[30%]">
            {auditorBadge && (
              <span className="self-start rounded-full bg-larioja-verde-texto px-3 py-1 font-montserrat text-xs font-bold text-white">
                {auditorBadge}
              </span>
            )}
            <strong className="font-montserrat text-lg text-larioja-azul dark:text-white">
              {auditor}
            </strong>
            {auditorText && (
              <span className="text-sm leading-relaxed text-gray-600 dark:text-white/70">
                {auditorText}
              </span>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
