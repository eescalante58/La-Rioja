import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { metaHref, metaText, textOr, type CmsSection } from "@/lib/cms-content";
import { waLink } from "@/lib/whatsapp";
import {
  BTN_WHATSAPP,
  CONTAINER,
  H2,
  MUTED,
  SECTION_ANCHOR,
  SECTION_PLAIN,
  SECTION_Y,
} from "@/components/site/section-ui";
import type { AdmissionFact, AdmissionStep } from "./types";

interface AdmissionStepsProps {
  /** Fila `cl_admision` (H2, subtítulo, datos útiles, botón y enlace a FAQ). */
  intro: CmsSection | undefined;
  steps: AdmissionStep[];
  /** Dígitos del WhatsApp institucional. */
  whatsapp: string;
}

/** Datos útiles con valor; los vacíos (por confirmar) no se publican. */
function admissionFacts(intro: CmsSection | undefined): AdmissionFact[] {
  return [
    { label: "Documentos requeridos", value: metaText(intro, "documentos", "") },
    { label: "Periodo de inscripción", value: metaText(intro, "periodo", "") },
    { label: "Duración del proceso", value: metaText(intro, "duracion", "") },
    { label: "Horario de visitas", value: metaText(intro, "horario", "") },
  ].filter((f) => f.value);
}

/**
 * «Cómo inscribir a tu familiar» (#admision): cuatro pasos numerados y un
 * bloque con datos útiles, botón para agendar la visita por WhatsApp y enlace
 * a preguntas frecuentes (al lado en escritorio, debajo en celular).
 */
export function AdmissionSteps({ intro, steps, whatsapp }: AdmissionStepsProps) {
  const facts = admissionFacts(intro);
  const faqText = metaText(
    intro,
    "enlace_faq_texto",
    "¿Tienes más preguntas? Visita nuestras preguntas frecuentes",
  );

  return (
    <section id="admision" className={`${SECTION_PLAIN} ${SECTION_ANCHOR}`}>
      <div className={`${CONTAINER} ${SECTION_Y} flex flex-col gap-8`}>
        <div className="flex max-w-[780px] flex-col gap-2.5">
          <h2 className={`${H2} m-0`}>{textOr(intro?.title, "Cómo inscribir a tu familiar")}</h2>
          {intro?.description && (
            <p className={`m-0 text-lg leading-relaxed ${MUTED}`}>{intro.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {steps.length > 0 && (
            <ol className="m-0 grid min-w-0 flex-[3] list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
              {steps.map((s, i) => (
                <li
                  key={s.key}
                  className="flex flex-col gap-2.5 rounded-[18px] bg-[#F3F5F8] p-6 dark:bg-surface-card"
                >
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full border-2 border-larioja-azul bg-larioja-amarillo font-montserrat text-lg font-extrabold text-larioja-azul"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <h3 className="m-0 font-montserrat text-lg font-bold text-larioja-azul dark:text-white">
                    <span className="sr-only">Paso {i + 1}: </span>
                    {s.title}
                  </h3>
                  {s.text && <p className={`m-0 text-[15px] leading-relaxed ${MUTED}`}>{s.text}</p>}
                </li>
              ))}
            </ol>
          )}

          <aside className="flex min-w-0 flex-1 flex-col gap-3.5 rounded-[20px] border-2 border-larioja-azul p-6 lg:max-w-[360px] dark:border-larioja-amarillo">
            {facts.length > 0 && (
              <>
                <h3 className="m-0 font-montserrat text-lg font-bold text-larioja-azul dark:text-white">
                  {metaText(intro, "titulo_datos", "Datos útiles")}
                </h3>
                <dl className="m-0 flex flex-col gap-3 text-sm">
                  {facts.map((f) => (
                    <div key={f.label}>
                      <dt className="font-bold text-larioja-azul dark:text-white">{f.label}</dt>
                      <dd className={`m-0 mt-0.5 whitespace-pre-line ${MUTED}`}>{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
            <a
              href={waLink(
                whatsapp,
                metaText(
                  intro,
                  "mensaje_whatsapp",
                  "Hola, quiero información para inscribir a un familiar en La Rioja",
                ),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BTN_WHATSAPP} rounded-[14px]`}
            >
              <MessageCircle size={20} aria-hidden="true" />
              {metaText(intro, "boton", "Agendar una visita")}
            </a>
            {faqText && (
              <Link
                href={metaHref(intro, "enlace_faq", "/faq")}
                className="text-sm font-semibold text-larioja-azul-enlace underline-offset-4 hover:underline dark:text-larioja-amarillo"
              >
                {faqText}
              </Link>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
