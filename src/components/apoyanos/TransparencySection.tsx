import Image from "next/image";
import { Check } from "lucide-react";
import { metaText, sectionImage, textOr, type CmsSection } from "@/lib/cms-content";
import { BODY, CONTAINER, H2, H3, MUTED, SECTION_PLAIN, SECTION_Y } from "./support-ui";

interface TransparencySectionProps {
  /** Fila `apoyanos_transparencia` (H2, subtítulo y títulos de bloque). */
  intro: CmsSection | undefined;
  /** Filas `apoyanos_pilar_N`. */
  pillars: CmsSection[];
  /** Filas `apoyanos_hito_N` (title = año). */
  milestones: CmsSection[];
  /** Filas `apoyanos_logro_N`: con foto son tarjetas; sin foto, ítems de lista. */
  achievements: CmsSection[];
  /** Fila `apoyanos_compromiso`. */
  commitment: CmsSection | undefined;
}

/**
 * «Transparencia y resultados» (#transparencia): pilares de confianza,
 * línea de tiempo (horizontal en escritorio, vertical en celular), logros
 * 2024–2025 y frase de compromiso.
 */
export function TransparencySection({
  intro,
  pillars,
  milestones,
  achievements,
  commitment,
}: TransparencySectionProps) {
  const achievementText = (a: CmsSection) => textOr(a.title, textOr(a.description, ""));
  const photoAchievements = achievements.filter((a) => sectionImage(a));
  const listAchievements = achievements.filter((a) => !sectionImage(a) && achievementText(a));
  const commitmentHighlight = metaText(commitment, "resaltado", "");

  return (
    <section id="transparencia" className={SECTION_PLAIN}>
      <div className={`${CONTAINER} ${SECTION_Y} flex flex-col gap-11`}>
        <div className="flex max-w-[760px] flex-col gap-2.5">
          <h2 className={`${H2} m-0`}>{textOr(intro?.title, "Tu aporte, con cuentas claras")}</h2>
          {intro?.description && (
            <p className={`m-0 text-lg leading-relaxed ${MUTED}`}>{intro.description}</p>
          )}
        </div>

        {pillars.length > 0 && (
          <div
            className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${
              pillars.length <= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
            }`}
          >
            {pillars.map((p) => (
              <div
                key={p.section_key}
                className="flex flex-col gap-2 rounded-b-2xl border-t-4 border-larioja-azul bg-[#F3F5F8] p-[22px] dark:border-larioja-amarillo dark:bg-slate-900/50"
              >
                <h3 className="m-0 font-montserrat text-lg font-bold text-larioja-azul dark:text-white">
                  {p.title}
                </h3>
                {p.description && (
                  <p className={`m-0 whitespace-pre-line text-sm leading-relaxed ${MUTED}`}>
                    {p.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {milestones.length > 0 && (
          <div className="flex flex-col gap-5">
            <h3 className={`${H3} m-0`}>
              {metaText(intro, "titulo_historia", "Nuestra historia")}
            </h3>
            <ol className="m-0 flex list-none flex-col p-0 pl-2 lg:grid lg:auto-cols-fr lg:grid-flow-col lg:pl-0 lg:pt-2">
              {milestones.map((m) => (
                <li
                  key={m.section_key}
                  className="relative flex flex-col gap-1.5 border-l-[3px] border-larioja-azul pb-6 pl-6 last:pb-0 dark:border-larioja-amarillo lg:border-l-0 lg:border-t-[3px] lg:pb-0 lg:pl-0 lg:pr-4 lg:pt-6"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-[9.5px] top-0 h-4 w-4 rounded-full border-[3px] border-larioja-azul bg-larioja-amarillo dark:border-larioja-amarillo lg:-top-[9.5px] lg:left-0"
                  />
                  <span className="font-montserrat text-[22px] font-extrabold leading-none text-larioja-azul dark:text-white">
                    {m.title}
                  </span>
                  {m.description && (
                    <span className={`text-sm leading-normal ${MUTED}`}>{m.description}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {achievements.length > 0 && (
          <div className="flex flex-col gap-5">
            <h3 className={`${H3} m-0`}>
              {metaText(intro, "titulo_logros", "Lo que logramos con tu apoyo")}
            </h3>
            {photoAchievements.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {photoAchievements.map((a) => (
                  <figure key={a.section_key} className="m-0 flex flex-col gap-2">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
                      <Image
                        src={sectionImage(a) as string}
                        alt={metaText(a, "foto_alt", achievementText(a))}
                        fill
                        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 400px"
                        className="object-cover"
                      />
                    </div>
                    <figcaption className={`text-sm ${MUTED}`}>{achievementText(a)}</figcaption>
                  </figure>
                ))}
              </div>
            )}
            {listAchievements.length > 0 && (
              <ul
                className={`m-0 grid list-none grid-cols-1 gap-x-8 gap-y-2.5 p-0 text-[15px] md:grid-cols-2 ${BODY}`}
              >
                {listAchievements.map((a) => (
                  <li key={a.section_key} className="flex gap-2.5">
                    <Check
                      size={20}
                      className="shrink-0 text-larioja-verde-texto dark:text-larioja-verde"
                      aria-hidden="true"
                    />
                    {achievementText(a)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {commitment?.title && (
          <blockquote className="m-0 rounded-[20px] bg-larioja-azul p-6 font-montserrat text-[clamp(19px,2vw,26px)] font-bold leading-[1.45] text-white dark:bg-larioja-azul-profundo dark:ring-1 dark:ring-white/10 sm:p-8">
            {commitment.title}
            {commitmentHighlight && (
              <span className="text-larioja-amarillo"> {commitmentHighlight}</span>
            )}
          </blockquote>
        )}
      </div>
    </section>
  );
}
