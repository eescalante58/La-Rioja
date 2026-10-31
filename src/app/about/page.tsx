import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AboutHero } from "@/components/about/AboutHero";
import { SectionNav, type SectionLink } from "@/components/about/SectionNav";
import { Timeline } from "@/components/about/Timeline";
import { PurposeCards } from "@/components/about/PurposeCards";
import { CareModel, type CareLevel, type CareProgram } from "@/components/about/CareModel";
import { WorkshopGallery } from "@/components/about/WorkshopGallery";
import { StatCounters, type Stat } from "@/components/about/StatCounters";
import { OrgChart } from "@/components/about/OrgChart";
import { TeamGrid } from "@/components/about/TeamGrid";
import { SolidarityModel } from "@/components/about/SolidarityModel";
import { FacilitiesGallery } from "@/components/about/FacilitiesGallery";
import { AboutCta } from "@/components/about/AboutCta";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { CONTAINER, SECTION_ANCHOR } from "@/components/site/section-ui";
import {
  metaHref,
  metaStrings,
  metaText,
  sectionsWithPrefix,
  textOr,
  type CmsSection,
} from "@/lib/cms-content";
import { statValueSchema } from "@/lib/validation/cms";
import { getPageContent, getPageTabTitle, getSiteGallery } from "@/services/cms";

const DESCRIPTION =
  "Conoce a La Rioja: ASPAPREM desde 1993 y el Centro de Formación Laboral para personas con discapacidad intelectual en El Salvador. Historia, modelo de atención, talleres y cómo nos sostenemos.";

export async function generateMetadata(): Promise<Metadata> {
  const tabTitle = await getPageTabTitle("quienes somos", "Quiénes Somos | La Rioja");
  return {
    title: { absolute: tabTitle },
    description: DESCRIPTION,
    alternates: { canonical: "/about" },
    openGraph: { title: tabTitle, description: DESCRIPTION, url: "/about" },
  };
}

export const revalidate = 60;

/** Enlaces de la barra de secciones (se muestran solo los de secciones presentes). */
const SECTION_LINKS: SectionLink[] = [
  { id: "historia", label: "Historia" },
  { id: "proposito", label: "Propósito" },
  { id: "modelo", label: "Modelo de atención" },
  { id: "talleres", label: "Talleres" },
  { id: "equipo", label: "Equipo" },
  { id: "sostenibilidad", label: "Modelo solidario" },
];

/** Programa del comparador a partir de su fila `cl_programa_*`. */
function toProgram(
  row: CmsSection | undefined,
  featured: boolean,
  fallbackHref: string,
): CareProgram | null {
  if (!row || !textOr(row.title, "")) return null;
  return {
    key: row.section_key,
    name: textOr(row.title, ""),
    age: metaText(row, "edad", ""),
    focus: metaText(row, "enfoque", ""),
    text: textOr(row.description, ""),
    button: metaText(row, "boton", ""),
    href: metaHref(row, "enlace", fallbackHref),
    featured,
  };
}

/** Contadores con valor entero válido; los vacíos (cifras por confirmar) se omiten. */
function toStats(rows: CmsSection[]): Stat[] {
  return rows.flatMap((row) => {
    const parsed = statValueSchema.safeParse(row.metadata?.valor);
    const label = textOr(row.title, "");
    if (!parsed.success || !label) return [];
    return [
      {
        key: row.section_key,
        value: Number(parsed.data),
        prefix: metaText(row, "prefijo", ""),
        suffix: metaText(row, "sufijo", ""),
        label,
      },
    ];
  });
}

/**
 * Nosotros. Recorrido: hero (#inicio), historia (#historia), propósito
 * (#proposito), modelo de atención (#modelo), talleres (#talleres),
 * transparencia, estructura y equipo (#equipo), modelo solidario
 * (#sostenibilidad), instalaciones (#instalaciones) y banner final.
 * Todo se edita en el CMS (página «Nosotros», filas `cl_*`; ver
 * supabase/migrations/20261022000000_nosotros_cms_secciones.sql y
 * supabase/migrations/20261107000000_quienes_somos_galeria_instalaciones.sql).
 */
export default async function AboutPage() {
  const content = (await getPageContent("quienes somos")) as CmsSection[];
  const section = (key: string) => content.find((s) => s.section_key === key);

  const facilities = section("cl_instalaciones");
  const facilityItems = facilities
    ? await getSiteGallery("quienes somos", "cl_instalaciones")
    : [];
  const showFacilities = facilityItems.length > 0;

  const links: SectionLink[] = showFacilities
    ? [
        ...SECTION_LINKS,
        {
          id: "instalaciones",
          label: metaText(facilities, "chip", "Instalaciones"),
        },
      ]
    : SECTION_LINKS;

  const programs = [
    toProgram(section("cl_programa_colegio"), false, "/programs#colegio"),
    toProgram(section("cl_programa_cfl"), true, "/programs"),
  ].filter((p): p is CareProgram => p !== null);
  const levelsRow = section("cl_niveles");
  const levels: CareLevel[] = sectionsWithPrefix(content, "cl_nivel_")
    .filter((l) => textOr(l.title, ""))
    .map((l) => ({
      key: l.section_key,
      name: textOr(l.title, ""),
      text: textOr(l.description, ""),
    }));
  const modelRow = section("cl_modelo");

  const accountability = section("cl_cuentas");
  const stats = toStats(sectionsWithPrefix(content, "cl_cifra_"));

  return (
    <main className="min-h-screen overflow-x-clip bg-white dark:bg-larioja-azul">
      <Navbar />

      <AboutHero hero={section("cl_hero")} />
      <SectionNav links={links} />

      <Timeline
        intro={section("cl_historia")}
        milestones={sectionsWithPrefix(content, "cl_hito_")}
      />

      <PurposeCards
        intro={section("cl_proposito")}
        mission={section("cl_mision")}
        vision={section("cl_vision")}
        values={sectionsWithPrefix(content, "cl_valor_")}
      />

      <CareModel
        title={textOr(modelRow?.title, "A quién acompañamos y cómo")}
        intro={textOr(modelRow?.description, "")}
        programs={programs}
        levelsTitle={textOr(levelsRow?.title, "Cinco niveles, un camino a la autonomía")}
        levelsIntro={textOr(levelsRow?.description, "")}
        levels={levels}
        areasTitle={metaText(levelsRow, "areas_titulo", "En todos los niveles:")}
        areas={metaStrings(levelsRow, "areas")}
      />

      <WorkshopGallery
        intro={section("cl_talleres")}
        workshops={sectionsWithPrefix(content, "cl_taller_")}
      />

      {/* Transparencia, estructura y equipo */}
      <section id="equipo" className={`bg-white dark:bg-larioja-azul ${SECTION_ANCHOR}`}>
        <div className="relative overflow-hidden bg-[#0A0C14] text-white">
          <AuroraBackground />
          <div className={`relative z-10 ${CONTAINER} flex flex-col gap-8 py-14 md:py-16`}>
            <h2 className="m-0 font-montserrat text-[clamp(28px,3.4vw,42px)] font-extrabold leading-[1.12] text-balance">
              {textOr(accountability?.title, "Una organización que rinde cuentas")}
            </h2>
            <StatCounters stats={stats} />
          </div>
        </div>
        <div className={`${CONTAINER} flex flex-col gap-14 pb-16 pt-14 md:pb-20 md:pt-[72px]`}>
          <OrgChart structure={section("cl_estructura")} />
          <TeamGrid intro={section("cl_equipo")} roles={sectionsWithPrefix(content, "cl_rol_")} />
        </div>
      </section>

      <SolidarityModel
        intro={section("cl_solidario")}
        sources={sectionsWithPrefix(content, "cl_fuente_")}
      />

      {showFacilities && (
        <FacilitiesGallery intro={facilities} items={facilityItems} />
      )}

      <AboutCta closing={section("cl_cierre")} />

      <Footer />
    </main>
  );
}
