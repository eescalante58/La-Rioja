import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SupportHero } from "@/components/apoyanos/SupportHero";
import { ImpactSection } from "@/components/apoyanos/ImpactSection";
import { SupportWays } from "@/components/apoyanos/SupportWays";
import { TransparencySection } from "@/components/apoyanos/TransparencySection";
import { HowToDonate } from "@/components/apoyanos/HowToDonate";
import { SupportFaq } from "@/components/apoyanos/SupportFaq";
import { SupportClosing } from "@/components/apoyanos/SupportClosing";
import { MobileDonateBar } from "@/components/apoyanos/MobileDonateBar";
import { metaText, sectionsWithPrefix, type CmsSection } from "@/lib/cms-content";
import { whatsappDigits } from "@/lib/whatsapp";
import { getPageContent } from "@/services/cms";

const DESCRIPTION =
  "Apadrina una beca, dona o alíate con La Rioja: formación laboral para personas con discapacidad intelectual en El Salvador desde 1993.";

export const metadata: Metadata = {
  title: "Apóyanos",
  description: DESCRIPTION,
  alternates: { canonical: "/apoyanos" },
  openGraph: { title: "Apóyanos | La Rioja", description: DESCRIPTION, url: "/apoyanos" },
};

export const revalidate = 60;

/**
 * Apóyanos (donaciones). Sigue el recorrido del donante: hero (#inicio),
 * reto e impacto (#impacto), formas de apoyar (#formas-de-apoyar),
 * transparencia (#transparencia), cómo donar (#donar), preguntas
 * (#preguntas) y cierre. Todo el contenido se edita en el CMS (página
 * `apoyanos`, ver supabase/migrations/20261021000001_apoyanos_cms_secciones.sql);
 * correo, Instagram y WhatsApp salen de `social media`.
 */
export default async function ApoyanosPage() {
  const [content, socialMedia] = await Promise.all([
    getPageContent("apoyanos") as Promise<CmsSection[]>,
    getPageContent("social media") as Promise<CmsSection[]>,
  ]);

  const section = (key: string) => content.find((s) => s.section_key === key);
  const social = (key: string) =>
    socialMedia.find((s) => s.section_key === key)?.description?.trim() ?? "";

  const whatsapp = whatsappDigits(social("whatsapp"));
  const rawEmail = social("email");
  const email = rawEmail
    ? rawEmail.replace(/^(?:https?:\/\/|mailto:)+/i, "").trim()
    : "lariojacflsv@gmail.com";
  const hero = section("apoyanos_hero");

  return (
    <main className="min-h-screen overflow-x-clip bg-white dark:bg-larioja-azul">
      <Navbar />

      <SupportHero hero={hero} credentials={sectionsWithPrefix(content, "apoyanos_credencial_")} />

      <ImpactSection
        challenge={section("apoyanos_reto")}
        figures={sectionsWithPrefix(content, "apoyanos_cifra_")}
        results={sectionsWithPrefix(content, "apoyanos_resultado_")}
        testimonial={section("apoyanos_testimonio")}
      />

      <SupportWays
        intro={section("apoyanos_formas")}
        sponsor={section("apoyanos_apadrina")}
        donation={section("apoyanos_donacion")}
        inKind={section("apoyanos_especie")}
        companies={section("apoyanos_empresas")}
        whatsapp={whatsapp}
        email={email}
      />

      <TransparencySection
        intro={section("apoyanos_transparencia")}
        pillars={sectionsWithPrefix(content, "apoyanos_pilar_")}
        milestones={sectionsWithPrefix(content, "apoyanos_hito_")}
        achievements={sectionsWithPrefix(content, "apoyanos_logro_")}
        commitment={section("apoyanos_compromiso")}
      />

      <HowToDonate
        payment={section("apoyanos_pago")}
        receipt={section("apoyanos_comprobante")}
        steps={sectionsWithPrefix(content, "apoyanos_paso_")}
        whatsapp={whatsapp}
        email={email}
      />

      <SupportFaq faqs={sectionsWithPrefix(content, "apoyanos_faq_")} />

      <SupportClosing
        closing={section("apoyanos_cierre")}
        whatsapp={whatsapp}
        email={email}
        instagram={social("instagram")}
      />

      <Footer />

      {/* Espacio para que la barra fija móvil no tape el final del pie. */}
      <div
        aria-hidden="true"
        className="h-[calc(76px+env(safe-area-inset-bottom))] bg-larioja-azul dark:bg-gray-950 sm:hidden"
      />
      <MobileDonateBar label={metaText(hero, "boton_1", "Quiero donar hoy")} />
    </main>
  );
}
