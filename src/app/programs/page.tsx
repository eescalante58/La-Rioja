import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SectionNav, type SectionLink } from "@/components/about/SectionNav";
import { ProgramHero } from "@/components/programs/ProgramHero";
import { AgeSelector } from "@/components/programs/AgeSelector";
import { AdaptiveLevels } from "@/components/programs/AdaptiveLevels";
import { CurriculumAxes } from "@/components/programs/CurriculumAxes";
import {
  SeccionTalleres,
  SeccionHabilidades,
  TALLERES,
} from "@/components/programs/ProgramasSecciones";
import { IntegralTraining } from "@/components/programs/IntegralTraining";
import { AdmissionSteps } from "@/components/programs/AdmissionSteps";
import { ProgramsCta } from "@/components/programs/ProgramsCta";
import type {
  AdaptiveLevel,
  AgeProgram,
  AdmissionStep,
  CurriculumAxis,
  IntegralSubject,
} from "@/components/programs/types";
import {
  CONTAINER,
  H2,
  MUTED,
  SECTION_ANCHOR,
  SECTION_TINT,
  SECTION_Y,
} from "@/components/site/section-ui";
import {
  metaHref,
  metaStrings,
  metaText,
  sectionsWithPrefix,
  textOr,
  type CmsSection,
} from "@/lib/cms-content";
import { capitalizar, numeroEnPalabras } from "@/lib/talleres";
import { whatsappDigits } from "@/lib/whatsapp";
import { getPageContent } from "@/services/cms";

const DESCRIPTION =
  "Programas de La Rioja para personas con discapacidad intelectual: Colegio La Rioja (12 a 20 años) y CFL La Rioja (20 a 55 años), ruta de cinco niveles, talleres vocacionales y proceso de admisión.";

export const metadata: Metadata = {
  title: "Programas",
  description: DESCRIPTION,
  alternates: { canonical: "/programs" },
  openGraph: { title: "Programas | La Rioja", description: DESCRIPTION, url: "/programs" },
};

export const revalidate = 60;

/** Enlaces de la barra de secciones (se muestran solo los de secciones presentes). */
const SECTION_LINKS: SectionLink[] = [
  { id: "programas", label: "Programas por edad" },
  { id: "niveles", label: "Ruta de formación" },
  { id: "talleres", label: "Talleres" },
  { id: "formacion-integral", label: "Formación integral" },
  { id: "admision", label: "Admisión" },
];

/** Programa por edad a partir de su fila `cl_programa_*`. */
function toAgeProgram(
  row: CmsSection | undefined,
  id: AgeProgram["id"],
  featured: boolean,
  fallbackHref: string,
): AgeProgram | null {
  const name = textOr(row?.title, "");
  if (!row || !name) return null;
  return {
    id,
    name,
    tab: metaText(row, "pestana", name),
    ages: metaText(row, "edad", ""),
    focus: metaText(row, "enfoque", ""),
    text: textOr(row.description, ""),
    includes: metaStrings(row, "incluye"),
    cta: { label: metaText(row, "boton", ""), href: metaHref(row, "enlace", fallbackHref) },
    featured,
  };
}

/** Filas con título, en el orden del CMS. */
function titled(content: CmsSection[], prefix: string): CmsSection[] {
  return sectionsWithPrefix(content, prefix).filter((r) => textOr(r.title, ""));
}

/** Enlace externo `https://` válido (p. ej. Google Maps); si no, cadena vacía. */
function httpsUrl(value: string | null | undefined): string {
  const url = value?.trim() ?? "";
  return /^https:\/\/[^\s]+$/.test(url) ? url : "";
}

/**
 * Programas. Recorrido de una familia: hero (#inicio), programa por edad
 * (#programas con #colegio y #cfl), ruta de cinco niveles y ejes (#niveles),
 * talleres (#talleres), formación integral (#formacion-integral), admisión
 * (#admision) y banner final. Todo se edita en el CMS (página «Programs»,
 * filas `cl_*`; ver supabase/migrations/20261023000000_programas_cms_secciones.sql).
 */
export default async function ProgramsPage() {
  const [content, socialMedia] = await Promise.all([
    getPageContent("programs") as Promise<CmsSection[]>,
    getPageContent("social media") as Promise<CmsSection[]>,
  ]);
  const section = (key: string) => content.find((s) => s.section_key === key);
  const social = (key: string) =>
    socialMedia.find((s) => s.section_key === key)?.description?.trim() ?? "";
  const whatsapp = whatsappDigits(social("whatsapp"));

  const selector = section("cl_selector");

  // Conteo de talleres para la ficha del programa CFL
  const talleresCount = TALLERES.length; // 4 talleres productivos hardcodeados
  const talleresLabel =
    talleresCount > 0
      ? `${capitalizar(numeroEnPalabras(talleresCount))} talleres vocacionales en grupos de 7 a 8 estudiantes`
      : "";

  const programs = [
    toAgeProgram(section("cl_programa_colegio"), "colegio", false, "#admision"),
    toAgeProgram(section("cl_programa_cfl"), "cfl", true, "#niveles"),
  ]
    .filter((p): p is AgeProgram => p !== null)
    .map((p) => {
      if (p.id === "cfl" && talleresLabel) {
        return {
          ...p,
          includes: p.includes.map((item) =>
            /talleres vocacionales/i.test(item) ? talleresLabel : item,
          ),
        };
      }
      return p;
    });

  const levelsRow = section("cl_niveles");
  const levels: AdaptiveLevel[] = titled(content, "cl_nivel_").map((l, i) => ({
    n: i + 1,
    name: textOr(l.title, ""),
    goal: metaText(l, "objetivo", ""),
    approach: metaText(l, "enfoque", ""),
    outcome: metaText(l, "logro", ""),
  }));
  const axesRow = section("cl_ejes");
  const axes: CurriculumAxis[] = titled(content, "cl_eje_").map((a) => ({
    key: a.section_key,
    area: metaText(a, "area", ""),
    name: textOr(a.title, ""),
    text: textOr(a.description, ""),
  }));
  const pdfLabel = metaText(levelsRow, "pdf_texto", "");
  // Ruta del sitio o URL https (p. ej. un PDF en Storage).
  const pdfHref =
    metaHref(levelsRow, "pdf_enlace", "") || httpsUrl(metaText(levelsRow, "pdf_enlace", ""));
  const pdf = pdfLabel && pdfHref ? { label: pdfLabel, href: pdfHref } : undefined;

  const subjects: IntegralSubject[] = titled(content, "cl_materia_").map((s) => ({
    key: s.section_key,
    name: textOr(s.title, ""),
    role: metaText(s, "rol", ""),
    text: textOr(s.description, ""),
  }));

  const steps: AdmissionStep[] = titled(content, "cl_paso_").map((s) => ({
    key: s.section_key,
    title: textOr(s.title, ""),
    text: textOr(s.description, ""),
  }));

  return (
    <main className="min-h-screen overflow-x-clip bg-white dark:bg-larioja-azul">
      <Navbar />

      <ProgramHero hero={section("cl_hero")} />
      <SectionNav links={SECTION_LINKS} />

      <AgeSelector
        title={textOr(selector?.title, "Un programa para cada etapa")}
        intro={textOr(selector?.description, "")}
        programs={programs}
      />

      {levels.length > 0 && (
        <section id="niveles" className={`${SECTION_TINT} ${SECTION_ANCHOR}`}>
          <div className={`${CONTAINER} ${SECTION_Y} flex flex-col gap-8`}>
            <div className="flex max-w-[780px] flex-col gap-2.5">
              <h2 className={`${H2} m-0`}>
                {textOr(levelsRow?.title, "Nuestra ruta de formación")}
              </h2>
              {levelsRow?.description && (
                <p className={`m-0 text-lg leading-relaxed ${MUTED}`}>{levelsRow.description}</p>
              )}
            </div>
            <AdaptiveLevels levels={levels} />
            <CurriculumAxes
              title={textOr(axesRow?.title, "Lo que se trabaja en todos los niveles")}
              note={textOr(axesRow?.description, "")}
              axes={axes}
              pdf={pdf}
            />
          </div>
        </section>
      )}

      <SeccionTalleres />

      <SeccionHabilidades />

      <IntegralTraining intro={section("cl_integral")} subjects={subjects} />

      <AdmissionSteps intro={section("cl_admision")} steps={steps} whatsapp={whatsapp} />

      <ProgramsCta
        closing={section("cl_cierre")}
        whatsapp={whatsapp}
        mapsUrl={httpsUrl(social("google maps"))}
      />

      <Footer />
    </main>
  );
}
