import { getPageContent } from "@/services/cms";
import { createStaticClient } from "@/lib/supabase/server";
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
import { Testimonial } from "@/components/home/Testimonial";
import { HomeCta } from "@/components/home/HomeCta";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Inicio | Centro de Formación Laboral La Rioja",
  description:
    "Formamos jóvenes y adultos con discapacidad intelectual para el trabajo y la vida. Conocé nuestros programas, talleres y cómo apoyarnos.",
};

export default async function Home() {
  const [homeRows, productsResult] = await Promise.allSettled([
    getPageContent("home"),
    createStaticClient()
      .from("products")
      .select("id, name, price, image_url, slug")
      .eq("featured", true)
      .eq("is_active", true)
      .limit(4),
  ]);

  const rows = homeRows.status === "fulfilled" ? homeRows.value : [];
  const products =
    productsResult.status === "fulfilled" && !productsResult.value.error
      ? (productsResult.value.data ?? [])
      : [];

  const byKey = Object.fromEntries(rows.map((r) => [r.section_key, r]));
  const campaignRows = rows.filter((r) => r.section_key.startsWith("cl_campaign"));

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
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
      <WorkshopsTeaser workshops={byKey["cl_workshops"] ?? null} />

      {/* 6 — Video institucional (solo si visible = true en metadata) */}
      <VideoSection video={byKey["cl_video"] ?? null} />

      {/* 7 — La Rioja Shop */}
      <FeaturedProducts products={products} />

      {/* 8 — Testimonio (solo si visible = true en metadata) */}
      <Testimonial testimonial={byKey["cl_testimonial"] ?? null} />

      {/* 9 — CTA cierre */}
      <HomeCta cta={byKey["cl_cta"] ?? null} />

      <Footer />
    </main>
  );
}
