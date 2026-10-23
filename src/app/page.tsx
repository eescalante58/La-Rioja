import { getPageContent, getPageTabTitle } from "@/services/cms";
import { createStaticClient } from "@/lib/supabase/server";
import { getTalleres, numeroEnPalabras } from "@/lib/talleres";
import type { Metadata } from "next";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HomeHero } from "@/components/home/HomeHero";
import { CampaignStrip } from "@/components/home/CampaignStrip";
import { StagesCards } from "@/components/home/StagesCards";
import { SolidarityBand } from "@/components/home/SolidarityBand";
import { WorkshopsTeaser } from "@/components/home/WorkshopsTeaser";
import { VideoSection } from "@/components/home/VideoSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { HomeCta } from "@/components/home/HomeCta";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const tabTitle = await getPageTabTitle("home", "La Rioja - Centro de Formación Laboral");
  return {
    title: { absolute: tabTitle },
    description:
      "Formamos jóvenes y adultos con discapacidad intelectual para el trabajo y la vida. Conocé nuestros programas, talleres y cómo apoyarnos.",
    alternates: { canonical: "/" },
    openGraph: {
      title: tabTitle,
      description:
        "Formamos jóvenes y adultos con discapacidad intelectual para el trabajo y la vida. Conocé nuestros programas, talleres y cómo apoyarnos.",
      url: "/",
    },
  };
}

export default async function Home() {
  const [homeRows, productsResult, talleresResult, socialMediaResult] = await Promise.allSettled([
    getPageContent("home"),
    createStaticClient()
      .from("products")
      .select("id, name, image_url, slug, variants:product_variants(price, is_available)")
      .eq("featured", true)
      .eq("is_active", true)
      .order("content_order", { ascending: true })
      .limit(4),
    getTalleres(),
    getPageContent("social media"),
  ]);

  const rows = homeRows.status === "fulfilled" ? homeRows.value : [];
  const socialRows = socialMediaResult.status === "fulfilled" ? socialMediaResult.value : [];
  const whatsappGlobal = socialRows.find((s) => s.section_key === "whatsapp")?.description?.trim();
  type ProductRow = {
    id: string;
    name: string;
    image_url: string | null;
    slug: string | null;
    variants: { price: number; is_available: boolean }[];
  };
  const rawProducts =
    productsResult.status === "fulfilled" && !productsResult.value.error
      ? ((productsResult.value.data ?? []) as ProductRow[])
      : [];
  const products = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    image_url: p.image_url,
    slug: p.slug,
    price: p.variants.length > 0 ? Math.min(...p.variants.map((v) => Number(v.price))) : 0,
  }));
  const talleresCount = talleresResult.status === "fulfilled" ? talleresResult.value.length : 0;
  const talleresLabel =
    talleresCount > 0 ? `Ver los ${numeroEnPalabras(talleresCount)} talleres` : undefined;

  const byKey = Object.fromEntries(rows.map((r) => [r.section_key, r]));
  const campaignRows = rows
    .filter(
      (r) => r.section_key.startsWith("cl_campaign") || r.section_key.startsWith("cl_campaing"),
    )
    .sort(
      (a, b) =>
        (a.content_order ?? 0) - (b.content_order ?? 0) ||
        a.section_key.localeCompare(b.section_key, "es", { numeric: true }),
    );
  const workshopRows = rows
    .filter((r) => r.section_key.startsWith("cl_workshop_"))
    .sort(
      (a, b) =>
        (a.content_order ?? 0) - (b.content_order ?? 0) ||
        a.section_key.localeCompare(b.section_key, "es", { numeric: true }),
    );

  return (
    <main className="min-h-screen overflow-x-clip bg-white dark:bg-gray-950">
      <Navbar />

      {/* 1 — Hero */}
      <HomeHero hero={byKey["cl_hero"] ?? null} />

      {/* 2 — Campañas */}
      <CampaignStrip rows={campaignRows} />

      {/* 3 — Dos etapas: Colegio y CFL */}
      <StagesCards
        colegio={byKey["cl_stage_colegio"] ?? null}
        cfl={byKey["cl_stage_cfl"] ?? null}
      />

      {/* 4 — Modelo solidario */}
      <SolidarityBand solidarity={byKey["cl_solidarity"] ?? null} />

      {/* 5 — Talleres */}
      <WorkshopsTeaser
        workshops={byKey["cl_workshops"] ?? null}
        items={workshopRows}
        talleresLabel={talleresLabel}
      />

      {/* 6 — La Rioja Shop */}
      <FeaturedProducts products={products} />

      {/* 7 — Videos institucionales (solo si visible = true en metadata) */}
      <VideoSection video={byKey["cl_video"] ?? null} />
      <VideoSection video={byKey["cl_video_2"] ?? null} />

      {/* 8 — Testimonios (solo si visible = true en metadata) */}
      <TestimonialsSection
        testimonial1={byKey["cl_testimonial"] ?? null}
        testimonial2={byKey["cl_testimonial_2"] ?? null}
      />

      {/* 9 — CTA cierre */}
      <HomeCta cta={byKey["cl_cta"] ?? null} whatsapp={whatsappGlobal} />

      <Footer />
    </main>
  );
}
