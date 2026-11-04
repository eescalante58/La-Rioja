import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MatriculaPageClient } from "@/components/matricula/MatriculaPageClient";
import { isMatriculaActive, getMatriculaPageData } from "@/lib/matricula/matricula-service";
import { getSiteGallery, getSectionContent, getPageContent } from "@/services/cms";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const active = await isMatriculaActive();
  if (!active) {
    return {
      title: "Página no encontrada | La Rioja",
      robots: { index: false, follow: false },
    };
  }

  const pageData = await getMatriculaPageData();
  const seo = pageData.seo;
  const meta = (seo?.metadata || {}) as Record<string, unknown>;

  const title = seo?.title || "Matrícula 2027 | La Rioja";
  const description =
    seo?.description ||
    "Admisiones e inscripciones 2027 para Colegio y Centro de Formación Laboral La Rioja.";
  const canonicalPath = (meta.canonical_path as string) || "/matricula";
  const ogImage = seo?.image_url || "/logo.svg";

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${SITE_URL}${canonicalPath}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonicalPath}`,
      images: [
        {
          url: ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`,
          alt: (meta.og_image_alt as string) || title,
        },
      ],
    },
    robots: {
      index: meta.robots_index !== false,
      follow: meta.robots_follow !== false,
    },
  };
}

export default async function MatriculaPage() {
  const active = await isMatriculaActive();
  if (!active) {
    notFound();
  }

  const [pageData, facilityItems, aboutFacilities, socialMedia] = await Promise.all([
    getMatriculaPageData(),
    getSiteGallery("quienes somos", "cl_instalaciones"),
    getSectionContent("quienes somos", "cl_instalaciones"),
    getPageContent("social media"),
  ]);
  const configMeta = (pageData.config?.metadata || {}) as Record<string, unknown>;
  const admissionYear = Number(configMeta.admission_year) || 2027;
  const aboutFacilitiesActive = Boolean(aboutFacilities);

  const mapsItem = Array.isArray(socialMedia)
    ? socialMedia.find((s) => s.section_key === "google maps")
    : null;
  const mapsMeta = (mapsItem?.metadata as Record<string, unknown>) || {};
  const mapsUrl = typeof mapsMeta.url === "string" && mapsMeta.url.trim()
    ? mapsMeta.url.trim()
    : (mapsItem?.description?.startsWith("http") ? mapsItem.description.trim() : "");
  const address = mapsItem?.description && !mapsItem.description.startsWith("http")
    ? mapsItem.description.trim()
    : "Urb. Lomas de Altamira, Calzada El Zenzontle, block 2 #7, San Salvador";

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <Navbar />
      <main id="contenido" className="flex-1">
        <MatriculaPageClient
          pageData={pageData}
          admissionYear={admissionYear}
          facilityItems={facilityItems}
          aboutFacilitiesActive={aboutFacilitiesActive}
          address={address}
          mapsUrl={mapsUrl}
        />
      </main>
      <Footer />
    </div>
  );
}
